"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const logger_1 = require("../utils/logger");
function healthRoutes(prisma, redis) {
    const router = (0, express_1.Router)();
    router.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        logger_1.logger.info("Health check endpoint called");
        try {
            // Check DB connection
            await prisma.$queryRaw `SELECT 1`;
            // Check Redis connection
            await redis.ping();
            res.status(200).json({
                success: true,
                message: "API is healthy!",
                dependencies: {
                    database: "up",
                    redis: "up",
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            res.status(503).json({
                success: false,
                message: "One or more dependencies are down",
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }));
    return router;
}
