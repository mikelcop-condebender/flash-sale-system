"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleRoutes = saleRoutes;
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const schema_1 = require("../schema");
function saleRoutes(prisma, redis) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/sale/status/:flashSaleId
     * Get current status of flash sale
     */
    router.get("/status/:flashSaleId", (0, validation_1.validateRequest)({ params: schema_1.saleStatusParamsSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { flashSaleId } = req.params;
        const cacheKey = `sale:status:${flashSaleId}`;
        // Try cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                data: JSON.parse(cached),
            });
        }
        // Get from database
        const flashSale = await prisma.flashSale.findUnique({
            where: { id: flashSaleId },
            select: {
                id: true,
                productName: true,
                totalStock: true,
                remainingStock: true,
                startTime: true,
                endTime: true,
                isActive: true,
                createdAt: true,
            },
        });
        if (!flashSale) {
            throw new errors_1.AppError("Flash sale not found", 404);
        }
        const now = new Date();
        const status = determineSaleStatus(flashSale, now);
        const timeUntilStart = flashSale.startTime > now
            ? flashSale.startTime.getTime() - now.getTime()
            : 0;
        const timeUntilEnd = flashSale.endTime > now
            ? flashSale.endTime.getTime() - now.getTime()
            : 0;
        const saleStatus = {
            ...flashSale,
            status,
            isActive: flashSale.isActive && status === "active",
            timeUntilStart,
            timeUntilEnd,
            soldCount: flashSale.totalStock - flashSale.remainingStock,
            soldPercentage: Math.round(((flashSale.totalStock - flashSale.remainingStock) /
                flashSale.totalStock) *
                100),
        };
        // Cache for 10 seconds for active sales, 60 seconds for inactive
        const cacheTime = status === "active" ? 10 : 60;
        await redis.setEx(cacheKey, cacheTime, JSON.stringify(saleStatus));
        res.json({
            success: true,
            data: saleStatus,
        });
    }));
    /**
     * GET /api/sale/active
     * Get all active flash sales
     */
    router.get("/active", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const now = new Date();
        const activeSales = (await prisma.flashSale.findMany({
            where: {
                isActive: true,
                startTime: { lte: now },
                endTime: { gte: now },
                remainingStock: { gt: 0 },
            },
            select: {
                id: true,
                productName: true,
                totalStock: true,
                remainingStock: true,
                startTime: true,
                endTime: true,
            },
            orderBy: {
                startTime: "desc",
            },
        }));
        const salesWithStatus = activeSales.map((sale) => ({
            ...sale,
            status: "active",
            soldCount: sale.totalStock - sale.remainingStock,
            soldPercentage: Math.round(((sale.totalStock - sale.remainingStock) / sale.totalStock) * 100),
        }));
        res.json({
            success: true,
            data: salesWithStatus,
        });
    }));
    return router;
}
function determineSaleStatus(flashSale, now) {
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
