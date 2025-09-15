import { PrismaClient, QueueStatus, PurchaseQueue } from "@prisma/client";
import type { RedisClientType } from "redis";
import { logger } from "../utils/logger";
import { PurchaseService } from "./PurchaseService";

export class PurchaseQueueService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private purchaseService: PurchaseService;

  constructor(private prisma: PrismaClient, private redis: RedisClientType) {
    this.purchaseService = new PurchaseService(prisma, redis);
  }

  async start() {
    logger.info(
      { service: "purchase-queue" },
      "Starting Purchase Queue Service"
    );
    this.isProcessing = true;

    // Process queue every 100ms for high throughput
    this.processingInterval = setInterval(() => {
      this.processQueue().catch((error) => {
        logger.error(
          { error: error instanceof Error ? error.message : error },
          "Error processing purchase queue"
        );
      });
    }, 100);
  }

  async stop() {
    logger.info(
      { service: "purchase-queue" },
      "Stopping Purchase Queue Service"
    );
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async addToQueue(userId: string, flashSaleId: string): Promise<string> {
    const queueItem = await this.prisma.purchaseQueue.create({
      data: {
        userId,
        flashSaleId,
        status: QueueStatus.PENDING,
      },
    });

    logger.info(
      { queueId: queueItem.id, userId, flashSaleId },
      `Added to purchase queue: ${queueItem.id}`
    );
    return queueItem.id;
  }

  /**
   * Grab a batch of pending items and mark them PROCESSING atomically,
   * then process them concurrently outside the transaction.
   */
  private async processQueue() {
    if (!this.isProcessing) return;

    const batchSize = 10; // Process up to 10 items at once

    let claimedItems: PurchaseQueue[] = [];

    try {
      // Atomically select pending items and mark as PROCESSING in a transaction.
      // Use Serializable isolation to reduce race conditions across workers.
      claimedItems = await this.prisma.$transaction(
        async (tx) => {
          const items = await tx.purchaseQueue.findMany({
            where: { status: QueueStatus.PENDING },
            orderBy: { createdAt: "asc" },
            take: batchSize,
          });

          if (items.length === 0) return [];

          const now = new Date();

          // Mark each selected item as PROCESSING (all inside the same transaction)
          const updated = await Promise.all(
            items.map((item) =>
              tx.purchaseQueue.update({
                where: { id: item.id },
                data: { status: QueueStatus.PROCESSING, processedAt: now },
              })
            )
          );

          return updated;
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      // If transaction fails (serialization error, etc.), log and return — it will retry next tick
      logger.warn(
        { error: err instanceof Error ? err.message : err },
        "Failed to claim queue items (will retry)"
      );
      return;
    }

    if (!claimedItems || claimedItems.length === 0) {
      return;
    }

    logger.debug(
      { count: claimedItems.length },
      `Processing ${claimedItems.length} queue items`
    );

    // Process items concurrently with controlled concurrency (handled by Promise.allSettled)
    const settleResults = await Promise.allSettled(
      claimedItems.map((item) => this.processQueueItem(item))
    );

    // Log aggregated result (optional)
    const successCount = settleResults.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failCount = settleResults.length - successCount;
    logger.info({ successCount, failCount }, "Batch processing finished");
  }

  private async processQueueItem(queueItem: PurchaseQueue) {
    try {
      // Attempt the purchase (PurchaseService will perform its own locking & transaction)
      await this.purchaseService.attemptPurchase(
        queueItem.userId,
        queueItem.flashSaleId
      );

      // Mark as completed
      await this.prisma.purchaseQueue.update({
        where: { id: queueItem.id },
        data: { status: QueueStatus.COMPLETED },
      });

      logger.info(
        {
          queueId: queueItem.id,
          userId: queueItem.userId,
          flashSaleId: queueItem.flashSaleId,
        },
        `Queue item processed successfully: ${queueItem.id}`
      );
    } catch (error) {
      // On any failure, mark the queue item as FAILED
      try {
        await this.prisma.purchaseQueue.update({
          where: { id: queueItem.id },
          data: { status: QueueStatus.FAILED },
        });
      } catch (updateErr) {
        logger.error(
          {
            error: updateErr instanceof Error ? updateErr.message : updateErr,
            queueId: queueItem.id,
          },
          "Failed to mark queue item as FAILED"
        );
      }

      logger.warn(
        {
          error: error instanceof Error ? error.message : error,
          queueId: queueItem.id,
          userId: queueItem.userId,
          flashSaleId: queueItem.flashSaleId,
        },
        `Queue item processing failed: ${queueItem.id}`
      );
    }
  }

  async getQueueStatus(queueId: string) {
    const queueItem = await this.prisma.purchaseQueue.findUnique({
      where: { id: queueId },
    });

    return queueItem;
  }

  async getUserQueuePosition(
    userId: string,
    flashSaleId: string
  ): Promise<number | null> {
    // Get earliest pending item for the user (asc = earliest)
    const userQueueItem = await this.prisma.purchaseQueue.findFirst({
      where: {
        userId,
        flashSaleId,
        status: QueueStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!userQueueItem) {
      return null;
    }

    const position = await this.prisma.purchaseQueue.count({
      where: {
        flashSaleId,
        status: QueueStatus.PENDING,
        createdAt: {
          lt: userQueueItem.createdAt,
        },
      },
    });

    return position + 1; // 1-based position
  }

  async cleanupOldQueueItems() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await this.prisma.purchaseQueue.deleteMany({
      where: {
        OR: [
          { status: QueueStatus.COMPLETED, processedAt: { lt: oneDayAgo } },
          { status: QueueStatus.FAILED, processedAt: { lt: oneDayAgo } },
        ],
      },
    });

    logger.info(
      { deletedCount: deleted.count },
      `Cleaned up ${deleted.count} old queue items`
    );
  }
}
