"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const admin_1 = require("./routes/admin");
const purchase_1 = require("./routes/purchase");
const sale_1 = require("./routes/sale");
const health_1 = require("./routes/health");
const utils_1 = require("./utils");
const prismaTestClient_1 = require("./utils/prismaTestClient");
const prisma = process.env.NODE_ENV === "test" ? prismaTestClient_1.prismaTest : utils_1.prismaClient;
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
const purchaseLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many purchase attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(limiter);
app.use("/", (0, health_1.healthRoutes)(prisma, utils_1.redisClient));
app.use("/api/admin", (0, admin_1.adminRoutes)(prisma, utils_1.redisClient));
app.use("/api/purchase", purchaseLimiter, (0, purchase_1.purchaseRoutes)(prisma, utils_1.redisClient));
app.use("/api/sale", (0, sale_1.saleRoutes)(prisma, utils_1.redisClient));
// export async function initServices() {}
exports.default = app;
