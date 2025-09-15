"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseService = void 0;
// src/services/PurchaseService.ts
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class PurchaseService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async attemptPurchase(userId, flashSaleId) {
        const lockKey = `purchase:${flashSaleId}:${userId}`;
        const lockTimeout = 30; // 30 seconds
        // Prevent duplicate processing
        const acquired = await this.acquireLock(lockKey, lockTimeout);
        logger_1.logger.info(`Lock acquired: ${acquired}`);
        if (!acquired) {
            throw new errors_1.AppError("Purchase already in progress", 409);
        }
        try {
            // Check if sale is active
            const saleStatus = await this.getSaleStatus(flashSaleId);
            if (!saleStatus.isActive) {
                throw new errors_1.AppError("Flash sale is not active", 400);
            }
            // Check if user already purchased
            const existingPurchase = await this.prisma.purchase.findUnique({
                where: {
                    userId_flashSaleId: {
                        userId,
                        flashSaleId,
                    },
                },
            });
            if (existingPurchase) {
                throw new errors_1.AppError("User has already purchased this item", 400);
            }
            // Attempt purchase with atomic transaction
            const result = await this.processPurchaseTransaction(userId, flashSaleId);
            // Update cache
            await this.updateSaleCache(flashSaleId);
            return result;
        }
        finally {
            await this.releaseLock(lockKey);
        }
    }
    async processPurchaseTransaction(userId, flashSaleId) {
        return await this.prisma.$transaction(async (tx) => {
            // Lock the flash sale row for update
            const flashSale = await tx.flashSale.findFirst({
                where: {
                    id: flashSaleId,
                    isActive: true,
                    remainingStock: { gt: 0 },
                    startTime: { lte: new Date() },
                    endTime: { gte: new Date() },
                },
            });
            if (!flashSale) {
                throw new errors_1.AppError("Flash sale is not available or sold out", 400);
            }
            if (flashSale.remainingStock <= 0) {
                throw new errors_1.AppError("Product is sold out", 400);
            }
            // Create purchase record
            const purchase = await tx.purchase.create({
                data: {
                    userId,
                    flashSaleId,
                    status: client_1.PurchaseStatus.COMPLETED,
                    pricePaid: flashSale.flashSalePrice,
                    currency: flashSale.currency,
                },
            });
            // Update inventory using optimistic locking
            const updatedSale = await tx.flashSale.update({
                where: {
                    id_version: { id: flashSaleId, version: flashSale.version },
                },
                data: {
                    remainingStock: flashSale.remainingStock - 1,
                    version: flashSale.version + 1,
                },
            });
            logger_1.logger.info({
                userId,
                flashSaleId,
                remainingStock: updatedSale.remainingStock,
            }, `Purchase successful: ${purchase.id}`);
            // ✅ Return full purchase details (with flashSale info)
            return {
                id: purchase.id,
                userId: purchase.userId,
                flashSaleId: purchase.flashSaleId,
                pricePaid: purchase.pricePaid,
                currency: purchase.currency,
                purchasedAt: purchase.purchasedAt,
                status: purchase.status,
                flashSale: {
                    originalPrice: flashSale.originalPrice,
                    flashSalePrice: flashSale.flashSalePrice,
                    currency: flashSale.currency,
                },
            };
        }, {
            isolationLevel: "Serializable",
            timeout: 10000, // 10 second timeout
        });
    }
    async getUserPurchaseStatus(userId, flashSaleId) {
        const purchase = await this.prisma.purchase.findUnique({
            where: {
                userId_flashSaleId: {
                    userId,
                    flashSaleId,
                },
            },
            select: {
                id: true,
                flashSaleId: true,
                pricePaid: true,
                currency: true,
                purchasedAt: true,
                status: true,
            },
        });
        return purchase;
    }
    async getSaleStatus(flashSaleId) {
        const cacheKey = `sale:status:${flashSaleId}`;
        // Try cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // Get from database
        const flashSale = await this.prisma.flashSale.findUnique({
            where: { id: flashSaleId },
            select: {
                id: true,
                isActive: true,
                remainingStock: true,
                startTime: true,
                endTime: true,
                productName: true,
            },
        });
        if (!flashSale) {
            throw new errors_1.AppError("Flash sale not found", 404);
        }
        const now = new Date();
        const saleStatus = {
            ...flashSale,
            isActive: flashSale.isActive &&
                now >= flashSale.startTime &&
                now <= flashSale.endTime &&
                flashSale.remainingStock > 0,
            status: this.determineSaleStatus(flashSale, now),
        };
        // Cache for 30 seconds
        await this.redis.setEx(cacheKey, 30, JSON.stringify(saleStatus));
        return saleStatus;
    }
    determineSaleStatus(flashSale, now) {
        if (!flashSale.isActive)
            return "inactive";
        if (now < flashSale.startTime)
            return "upcoming";
        if (now > flashSale.endTime)
            return "ended";
        if (flashSale.remainingStock <= 0)
            return "sold_out";
        return "active";
    }
    async updateSaleCache(flashSaleId) {
        const cacheKey = `sale:status:${flashSaleId}`;
        await this.redis.del(cacheKey);
    }
    async acquireLock(key, timeout) {
        const result = await this.redis.set(key, "1", {
            EX: timeout,
            NX: true,
        });
        return result === "OK";
    }
    async releaseLock(key) {
        await this.redis.del(key);
    }
}
exports.PurchaseService = PurchaseService;
