import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { RedisClientType } from "redis";
import { validateRequest } from "../middleware/validation";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/errors";
import {
  ActivateFlashSaleBody,
  CreateFlashSaleBody,
  FlashSaleParams,
  UpdateFlashSaleBody,
} from "../types";
import { activateSchema, flashSaleSchema, uuidParamSchema } from "../schema";

export function adminRoutes(
  prisma: PrismaClient,
  redis: RedisClientType
): Router {
  const router = Router();

  /**
   * POST /api/admin/flash-sale
   * Create a new flash sale
   */
  router.post(
    "/flash-sale",
    validateRequest({ body: flashSaleSchema }),
    asyncHandler(
      async (req: Request<{}, {}, CreateFlashSaleBody>, res: Response) => {
        const {
          productName,
          productDescription,
          originalPrice,
          flashSalePrice,
          currency = "USD",
          totalStock,
          startTime,
          endTime,
        } = req.body;

        if (flashSalePrice >= originalPrice) {
          res.status(400).json({
            success: false,
            message: "Flash sale price must be less than original price",
            code: "INVALID_PRICING",
          });
          console.error("Flash sale price must be less than original price");
          return;
        }

        const flashSale = await prisma.flashSale.create({
          data: {
            productName,
            productDescription,
            originalPrice,
            flashSalePrice,
            currency,
            totalStock,
            remainingStock: totalStock,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            isActive: true,
          },
        });

        res.status(201).json({
          success: true,
          message: "Flash sale created successfully",
          data: flashSale,
        });
      }
    )
  );

  /**
   * PUT /api/admin/flash-sale/:id
   * Update flash sale configuration
   */
  router.put(
    "/flash-sale/:id",
    validateRequest({
      params: uuidParamSchema,
      body: flashSaleSchema,
    }),
    asyncHandler(
      async (
        req: Request<FlashSaleParams, {}, UpdateFlashSaleBody>,
        res: Response
      ) => {
        const { id } = req.params;
        const {
          productName,
          productDescription,
          originalPrice,
          flashSalePrice,
          currency,
          totalStock,
          startTime,
          endTime,
        } = req.body;

        const existingSale = await prisma.flashSale.findUnique({
          where: { id },
        });

        if (!existingSale) {
          throw new NotFoundError("Flash sale");
        }

        if (existingSale.startTime <= new Date()) {
          res.status(400).json({
            success: false,
            message: "Cannot modify a flash sale that has already started",
            code: "SALE_ALREADY_STARTED",
          });
          console.error("Cannot modify a flash sale that has already started");
          return;
        }

        if (flashSalePrice >= originalPrice) {
          res.status(400).json({
            success: false,
            message: "Flash sale price must be less than original price",
            code: "INVALID_PRICING",
          });
          console.error("Flash sale price must be less than original price");
          return;
        }

        const updatedSale = await prisma.flashSale.update({
          where: { id },
          data: {
            productName,
            productDescription,
            originalPrice,
            flashSalePrice,
            currency,
            totalStock,
            remainingStock: totalStock,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
          },
        });

        await redis.del(`sale:status:${id}`);

        res.json({
          success: true,
          message: "Flash sale updated successfully",
          data: updatedSale,
        });
      }
    )
  );

  /**
   * POST /api/admin/flash-sale/:id/activate
   * Activate/deactivate flash sale
   */
  router.post(
    "/flash-sale/:id/activate",
    validateRequest({
      params: uuidParamSchema,
      body: activateSchema,
    }),
    asyncHandler(
      async (
        req: Request<FlashSaleParams, {}, ActivateFlashSaleBody>,
        res: Response
      ) => {
        const { id } = req.params;
        const { isActive } = req.body;

        const flashSale = await prisma.flashSale.update({
          where: { id },
          data: { isActive },
        });

        await redis.del(`sale:status:${id}`);

        res.json({
          success: true,
          message: `Flash sale ${
            isActive ? "activated" : "deactivated"
          } successfully`,
          data: flashSale,
        });
      }
    )
  );

  /**
   * GET /api/admin/flash-sales
   * Get all flash sales with statistics
   */
  router.get(
    "/flash-sales",
    asyncHandler(async (req: Request, res: Response) => {
      const flashSales = await prisma.flashSale.findMany({
        include: {
          _count: {
            select: { purchases: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const salesWithStats = flashSales.map((sale) => ({
        ...sale,
        soldCount: sale.totalStock - sale.remainingStock,
        purchaseCount: sale._count.purchases,
        soldPercentage: Math.round(
          ((sale.totalStock - sale.remainingStock) / sale.totalStock) * 100
        ),
      }));

      res.json({
        success: true,
        data: salesWithStats,
      });
    })
  );

  /**
   * GET /api/admin/flash-sale/:id/analytics
   * Get detailed analytics for a flash sale
   */
  router.get(
    "/flash-sale/:id/analytics",
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(async (req: Request<FlashSaleParams>, res: Response) => {
      const { id } = req.params;

      const flashSale = await prisma.flashSale.findUnique({
        where: { id },
        include: {
          purchases: {
            select: {
              id: true,
              userId: true,
              purchasedAt: true,
              status: true,
            },
            orderBy: { purchasedAt: "asc" },
          },
        },
      });

      if (!flashSale) {
        throw new NotFoundError("Flash sale");
      }

      const purchasesByMinute = flashSale.purchases.reduce((acc, purchase) => {
        const minute = new Date(purchase.purchasedAt)
          .toISOString()
          .slice(0, 16);
        acc[minute] = (acc[minute] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const analytics = {
        flashSale: {
          id: flashSale.id,
          productName: flashSale.productName,
          totalStock: flashSale.totalStock,
          remainingStock: flashSale.remainingStock,
          soldCount: flashSale.totalStock - flashSale.remainingStock,
          soldPercentage: Math.round(
            ((flashSale.totalStock - flashSale.remainingStock) /
              flashSale.totalStock) *
              100
          ),
          startTime: flashSale.startTime,
          endTime: flashSale.endTime,
          duration: flashSale.endTime.getTime() - flashSale.startTime.getTime(),
        },
        purchases: {
          total: flashSale.purchases.length,
          successful: flashSale.purchases.filter(
            (p) => p.status === "COMPLETED"
          ).length,
          failed: flashSale.purchases.filter((p) => p.status === "FAILED")
            .length,
          firstPurchase: flashSale.purchases[0]?.purchasedAt,
          lastPurchase:
            flashSale.purchases[flashSale.purchases.length - 1]?.purchasedAt,
        },
        timeline: purchasesByMinute,
      };

      res.json({
        success: true,
        data: analytics,
      });
    })
  );

  /**
   * DELETE /api/admin/flash-sale/:id
   * Delete a flash sale
   */
  router.delete(
    "/flash-sale/:id",
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(async (req: Request<FlashSaleParams>, res: Response) => {
      const { id } = req.params;

      const existingSale = await prisma.flashSale.findUnique({ where: { id } });
      if (!existingSale) {
        throw new NotFoundError("Flash sale");
      }

      if (existingSale.startTime <= new Date()) {
        res.status(400).json({
          success: false,
          message: "Cannot delete a flash sale that has already started",
          code: "SALE_ALREADY_STARTED",
        });
        console.error("Cannot delete a flash sale that has already started");
        return;
      }

      await prisma.flashSale.delete({ where: { id } });

      await redis.del(`sale:status:${id}`);

      res.json({
        success: true,
        message: "Flash sale deleted successfully",
      });
    })
  );

  return router;
}
