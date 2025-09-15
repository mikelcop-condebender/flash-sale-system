import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { RedisClientType } from "redis";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

export function healthRoutes(
  prisma: PrismaClient,
  redis: RedisClientType
): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      logger.info("Health check endpoint called");
      try {
        // Check DB connection
        await prisma.$queryRaw`SELECT 1`;

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
      } catch (error) {
        res.status(503).json({
          success: false,
          message: "One or more dependencies are down",
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      }
    })
  );

  return router;
}
