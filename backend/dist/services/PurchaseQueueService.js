"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseQueueService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const PurchaseService_1 = require("./PurchaseService");
class PurchaseQueueService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.isProcessing = false;
        this.processingInterval = null;
        this.purchaseService = new PurchaseService_1.PurchaseService(prisma, redis);
    }
    async start() {
        logger_1.logger.info({ service: "purchase-queue" }, "Starting Purchase Queue Service");
        this.isProcessing = true;
        // Process queue every 100ms for high throughput
        this.processingInterval = setInterval(() => {
            this.processQueue().catch((error) => {
                logger_1.logger.error({ error: error instanceof Error ? error.message : error }, "Error processing purchase queue");
            });
        }, 100);
    }
    async stop() {
        logger_1.logger.info({ service: "purchase-queue" }, "Stopping Purchase Queue Service");
        this.isProcessing = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }
    async addToQueue(userId, flashSaleId) {
        const queueItem = await this.prisma.purchaseQueue.create({
            data: {
                userId,
                flashSaleId,
                status: client_1.QueueStatus.PENDING,
            },
        });
        logger_1.logger.info({ queueId: queueItem.id, userId, flashSaleId }, `Added to purchase queue: ${queueItem.id}`);
        return queueItem.id;
    }
    /**
     * Grab a batch of pending items and mark them PROCESSING atomically,
     * then process them concurrently outside the transaction.
     */
    async processQueue() {
        if (!this.isProcessing)
            return;
        const batchSize = 10; // Process up to 10 items at once
        let claimedItems = [];
        try {
            // Atomically select pending items and mark as PROCESSING in a transaction.
            // Use Serializable isolation to reduce race conditions across workers.
            claimedItems = await this.prisma.$transaction(async (tx) => {
                const items = await tx.purchaseQueue.findMany({
                    where: { status: client_1.QueueStatus.PENDING },
                    orderBy: { createdAt: "asc" },
                    take: batchSize,
                });
                if (items.length === 0)
                    return [];
                const now = new Date();
                // Mark each selected item as PROCESSING (all inside the same transaction)
                const updated = await Promise.all(items.map((item) => tx.purchaseQueue.update({
                    where: { id: item.id },
                    data: { status: client_1.QueueStatus.PROCESSING, processedAt: now },
                })));
                return updated;
            }, { isolationLevel: "Serializable" });
        }
        catch (err) {
            // If transaction fails (serialization error, etc.), log and return — it will retry next tick
            logger_1.logger.warn({ error: err instanceof Error ? err.message : err }, "Failed to claim queue items (will retry)");
            return;
        }
        if (!claimedItems || claimedItems.length === 0) {
            return;
        }
        logger_1.logger.debug({ count: claimedItems.length }, `Processing ${claimedItems.length} queue items`);
        // Process items concurrently with controlled concurrency (handled by Promise.allSettled)
        const settleResults = await Promise.allSettled(claimedItems.map((item) => this.processQueueItem(item)));
        // Log aggregated result (optional)
        const successCount = settleResults.filter((r) => r.status === "fulfilled").length;
        const failCount = settleResults.length - successCount;
        logger_1.logger.info({ successCount, failCount }, "Batch processing finished");
    }
    async processQueueItem(queueItem) {
        try {
            // Attempt the purchase (PurchaseService will perform its own locking & transaction)
            await this.purchaseService.attemptPurchase(queueItem.userId, queueItem.flashSaleId);
            // Mark as completed
            await this.prisma.purchaseQueue.update({
                where: { id: queueItem.id },
                data: { status: client_1.QueueStatus.COMPLETED },
            });
            logger_1.logger.info({
                queueId: queueItem.id,
                userId: queueItem.userId,
                flashSaleId: queueItem.flashSaleId,
            }, `Queue item processed successfully: ${queueItem.id}`);
        }
        catch (error) {
            // On any failure, mark the queue item as FAILED
            try {
                await this.prisma.purchaseQueue.update({
                    where: { id: queueItem.id },
                    data: { status: client_1.QueueStatus.FAILED },
                });
            }
            catch (updateErr) {
                logger_1.logger.error({
                    error: updateErr instanceof Error ? updateErr.message : updateErr,
                    queueId: queueItem.id,
                }, "Failed to mark queue item as FAILED");
            }
            logger_1.logger.warn({
                error: error instanceof Error ? error.message : error,
                queueId: queueItem.id,
                userId: queueItem.userId,
                flashSaleId: queueItem.flashSaleId,
            }, `Queue item processing failed: ${queueItem.id}`);
        }
    }
    async getQueueStatus(queueId) {
        const queueItem = await this.prisma.purchaseQueue.findUnique({
            where: { id: queueId },
        });
        return queueItem;
    }
    async getUserQueuePosition(userId, flashSaleId) {
        // Get earliest pending item for the user (asc = earliest)
        const userQueueItem = await this.prisma.purchaseQueue.findFirst({
            where: {
                userId,
                flashSaleId,
                status: client_1.QueueStatus.PENDING,
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
                status: client_1.QueueStatus.PENDING,
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
                    { status: client_1.QueueStatus.COMPLETED, processedAt: { lt: oneDayAgo } },
                    { status: client_1.QueueStatus.FAILED, processedAt: { lt: oneDayAgo } },
                ],
            },
        });
        logger_1.logger.info({ deletedCount: deleted.count }, `Cleaned up ${deleted.count} old queue items`);
    }
}
exports.PurchaseQueueService = PurchaseQueueService;
