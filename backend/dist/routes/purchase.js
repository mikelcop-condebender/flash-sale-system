"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseRoutes = purchaseRoutes;
const express_1 = require("express");
const PurchaseService_1 = require("../services/PurchaseService");
const validation_1 = require("../middleware/validation");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const schema_1 = require("../schema");
function purchaseRoutes(prisma, redis) {
    const router = (0, express_1.Router)();
    const purchaseService = new PurchaseService_1.PurchaseService(prisma, redis);
    /**
     * Middleware: Ensure Redis connectivity
     */
    const ensureRedisConnected = (0, asyncHandler_1.asyncHandler)(async (_req, _res, next) => {
        try {
            if (!redis.isOpen) {
                logger_1.logger.error("Redis is not connected");
                throw new errors_1.AppError("Redis is unavailable", 503, "REDIS_UNAVAILABLE");
            }
            await redis.ping();
            next();
        }
        catch (error) {
            logger_1.logger.error(`Redis connectivity check failed: ${error.message}`);
            throw new errors_1.AppError("Redis is unavailable", 503, "REDIS_UNAVAILABLE");
        }
    });
    /**
     * Middleware: Ensure Prisma (DB) connectivity
     */
    const ensurePrismaConnected = (0, asyncHandler_1.asyncHandler)(async (_req, _res, next) => {
        try {
            await prisma.$queryRaw `SELECT 1`; // lightweight check
            next();
        }
        catch (error) {
            logger_1.logger.error(`Prisma connectivity check failed: ${error.message}`);
            throw new errors_1.AppError("Database is unavailable", 503, "DB_UNAVAILABLE");
        }
    });
    /**
     * POST /api/purchase
     * Attempt to purchase an item
     */
    router.post("/", ensureRedisConnected, ensurePrismaConnected, (0, validation_1.validateRequest)({ body: schema_1.purchaseSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { userId, flashSaleId } = req.body;
        try {
            logger_1.logger.info(`Purchase attempt - userId=${userId}, flashSaleId=${flashSaleId}`);
            const result = await purchaseService.attemptPurchase(userId, flashSaleId);
            logger_1.logger.info(`Purchase success - purchaseId=${result.id}, userId=${userId}, flashSaleId=${flashSaleId}`);
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
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                logger_1.logger.warn(`Purchase failed - code=${error.code}, message=${error.message}, userId=${userId}, flashSaleId=${flashSaleId}`);
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code || "PURCHASE_FAILED",
                });
            }
            else {
                logger_1.logger.error(`Unexpected purchase error - userId=${userId}, flashSaleId=${flashSaleId}, error=${error.message}`);
                throw error;
            }
        }
    }));
    /**
     * GET /api/purchase/status/:userId/:flashSaleId
     * Check user's purchase status
     */
    router.get("/status/:userId/:flashSaleId", ensureRedisConnected, ensurePrismaConnected, (0, validation_1.validateRequest)({ params: schema_1.purchaseStatusParamsSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { userId, flashSaleId } = req.params;
        logger_1.logger.info(`Checking purchase status - userId=${userId}, flashSaleId=${flashSaleId}`);
        const purchaseStatus = await purchaseService.getUserPurchaseStatus(userId, flashSaleId);
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
    }));
    return router;
}
