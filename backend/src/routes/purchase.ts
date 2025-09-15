import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { RedisClientType } from "redis";
import { PurchaseService } from "../services/PurchaseService";
import { validateRequest } from "../middleware/validation";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { PurchaseRequestBody, PurchaseStatusParams } from "../types";
import { purchaseSchema, purchaseStatusParamsSchema } from "../schema";

export function purchaseRoutes(
  prisma: PrismaClient,
  redis: RedisClientType
): Router {
  const router = Router();
  const purchaseService = new PurchaseService(prisma, redis);

  /**
   * Middleware: Ensure Redis connectivity
   */
  const ensureRedisConnected = asyncHandler(
    async (_req: Request, _res: Response, next: NextFunction) => {
      try {
        if (!redis.isOpen) {
          logger.error("Redis is not connected");
          throw new AppError("Redis is unavailable", 503, "REDIS_UNAVAILABLE");
        }
        await redis.ping();
        next();
      } catch (error) {
        logger.error(
          `Redis connectivity check failed: ${(error as Error).message}`
        );
        throw new AppError("Redis is unavailable", 503, "REDIS_UNAVAILABLE");
      }
    }
  );

  /**
   * Middleware: Ensure Prisma (DB) connectivity
   */
  const ensurePrismaConnected = asyncHandler(
    async (_req: Request, _res: Response, next: NextFunction) => {
      try {
        await prisma.$queryRaw`SELECT 1`; // lightweight check
        next();
      } catch (error) {
        logger.error(
          `Prisma connectivity check failed: ${(error as Error).message}`
        );
        throw new AppError("Database is unavailable", 503, "DB_UNAVAILABLE");
      }
    }
  );

  /**
   * POST /api/purchase
   * Attempt to purchase an item
   */
  router.post(
    "/",
    ensureRedisConnected,
    ensurePrismaConnected,
    validateRequest({ body: purchaseSchema }),
    asyncHandler(
      async (req: Request<{}, {}, PurchaseRequestBody>, res: Response) => {
        const { userId, flashSaleId } = req.body;

        try {
          logger.info(
            `Purchase attempt - userId=${userId}, flashSaleId=${flashSaleId}`
          );

          const result = await purchaseService.attemptPurchase(
            userId,
            flashSaleId
          );

          logger.info(
            `Purchase success - purchaseId=${result.id}, userId=${userId}, flashSaleId=${flashSaleId}`
          );

          res.status(200).json({
            success: true,
            message: "Purchase successful!",
            data: {
              purchaseId: result.id,
              userId: result.userId,
              flashSaleId: result.flashSaleId,
              pricePaid: result.pricePaid,
              currency: result.currency,
              originalPrice: result.flashSale.originalPrice,
              purchasedAt: result.purchasedAt,
              status: result.status,
            },
          });
        } catch (error) {
          if (error instanceof AppError) {
            logger.warn(
              `Purchase failed - code=${error.code}, message=${error.message}, userId=${userId}, flashSaleId=${flashSaleId}`
            );

            res.status(error.statusCode).json({
              success: false,
              message: error.message,
              code: error.code || "PURCHASE_FAILED",
            });
          } else {
            logger.error(
              `Unexpected purchase error - userId=${userId}, flashSaleId=${flashSaleId}, error=${
                (error as Error).message
              }`
            );
            throw error;
          }
        }
      }
    )
  );

  /**
   * GET /api/purchase/status/:userId/:flashSaleId
   * Check user's purchase status
   */
  router.get(
    "/status/:userId/:flashSaleId",
    ensureRedisConnected,
    ensurePrismaConnected,
    validateRequest({ params: purchaseStatusParamsSchema }),
    asyncHandler(async (req: Request<PurchaseStatusParams>, res: Response) => {
      const { userId, flashSaleId } = req.params;

      logger.info(
        `Checking purchase status - userId=${userId}, flashSaleId=${flashSaleId}`
      );

      const purchaseStatus = await purchaseService.getUserPurchaseStatus(
        userId,
        flashSaleId
      );

      res.json({
        success: true,
        data: {
          hasPurchased: !!purchaseStatus,
          purchase: purchaseStatus
            ? {
                id: purchaseStatus.id,
                flashSaleId: purchaseStatus.flashSaleId,
                pricePaid: purchaseStatus.pricePaid,
                currency: purchaseStatus.currency,
                purchasedAt: purchaseStatus.purchasedAt,
                status: purchaseStatus.status,
              }
            : null,
        },
      });
    })
  );

  return router;
}
