"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/purchase.integration.test.ts
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const prismaTestClient_1 = require("../utils/prismaTestClient");
const utils_1 = require("../utils");
const client_1 = require("@prisma/client");
describe("Flash Sale API Endpoints (Integration Tests)", () => {
    let flashSaleId;
    beforeAll(async () => {
        // Ensure DB + Redis are connected
        await prismaTestClient_1.prismaTest.$connect();
        if (!utils_1.redisClient.isOpen) {
            await utils_1.redisClient.connect();
        }
    });
    afterAll(async () => {
        // Cleanup and close connections
        await prismaTestClient_1.prismaTest.purchaseQueue.deleteMany();
        await prismaTestClient_1.prismaTest.purchase.deleteMany();
        await prismaTestClient_1.prismaTest.flashSale.deleteMany();
        await prismaTestClient_1.prismaTest.$disconnect();
        if (utils_1.redisClient.isOpen) {
            await utils_1.redisClient.quit();
        }
    });
    beforeEach(async () => {
        // Reset DB before each test
        await prismaTestClient_1.prismaTest.purchaseQueue.deleteMany();
        await prismaTestClient_1.prismaTest.purchase.deleteMany();
        await prismaTestClient_1.prismaTest.flashSale.deleteMany();
        // Seed a test flash sale
        const flashSale = await prismaTestClient_1.prismaTest.flashSale.create({
            data: {
                productName: "Test Product",
                productDescription: "This is a test product",
                originalPrice: new client_1.Prisma.Decimal(1000),
                flashSalePrice: new client_1.Prisma.Decimal(500),
                currency: "USD",
                totalStock: 10,
                remainingStock: 10,
                startTime: new Date(Date.now() - 60000), // already started
                endTime: new Date(Date.now() + 3600000), // 1 hour later
                isActive: true,
            },
        });
        flashSaleId = flashSale.id;
        // Clear Redis cache
        await utils_1.redisClient.flushAll();
    });
    test("GET /api/sale/status/:flashSaleId should return sale status", async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .get(`/api/sale/status/${flashSaleId}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("productName", "Test Product");
    });
    test("POST /api/purchase should process purchase request", async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .post("/api/purchase")
            .send({ userId: "api-test-user-1", flashSaleId })
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("Purchase successful");
    });
});
