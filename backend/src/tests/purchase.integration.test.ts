// src/tests/purchase.integration.test.ts
import request from "supertest";
import app from "../server";
import { prismaTest } from "../utils/prismaTestClient";
import { redisClient } from "../utils";
import { Prisma } from "@prisma/client";

describe("Flash Sale API Endpoints (Integration Tests)", () => {
  let flashSaleId: string;

  beforeAll(async () => {
    // Ensure DB + Redis are connected
    await prismaTest.$connect();
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    // Cleanup and close connections
    await prismaTest.purchaseQueue.deleteMany();
    await prismaTest.purchase.deleteMany();
    await prismaTest.flashSale.deleteMany();

    await prismaTest.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    // Reset DB before each test
    await prismaTest.purchaseQueue.deleteMany();
    await prismaTest.purchase.deleteMany();
    await prismaTest.flashSale.deleteMany();

    // Seed a test flash sale
    const flashSale = await prismaTest.flashSale.create({
      data: {
        productName: "Test Product",
        productDescription: "This is a test product",
        originalPrice: new Prisma.Decimal(1000),
        flashSalePrice: new Prisma.Decimal(500),
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
    await redisClient.flushAll();
  });

  test("GET /api/sale/status/:flashSaleId should return sale status", async () => {
    const response = await request(app)
      .get(`/api/sale/status/${flashSaleId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("productName", "Test Product");
  });

  test("POST /api/purchase should process purchase request", async () => {
    const response = await request(app)
      .post("/api/purchase")
      .send({ userId: "api-test-user-1", flashSaleId })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Purchase successful");
  });
});
