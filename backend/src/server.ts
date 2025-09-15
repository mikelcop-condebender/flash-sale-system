//
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { adminRoutes } from "./routes/admin";
import { purchaseRoutes } from "./routes/purchase";
import { saleRoutes } from "./routes/sale";
import { healthRoutes } from "./routes/health";
import { prismaClient, redisClient } from "./utils";

import { prismaTest } from "./utils/prismaTestClient";

const prisma = process.env.NODE_ENV === "test" ? prismaTest : prismaClient;

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many purchase attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use("/", healthRoutes(prisma, redisClient));
app.use("/api/admin", adminRoutes(prisma, redisClient));
app.use("/api/purchase", purchaseLimiter, purchaseRoutes(prisma, redisClient));
app.use("/api/sale", saleRoutes(prisma, redisClient));

// export async function initServices() {}

export default app;
