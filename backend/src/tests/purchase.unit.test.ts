// src/tests/purchase.test.ts
import { Prisma } from "@prisma/client";
import { createClient, RedisClientType } from "redis";
import { PurchaseService } from "../services/PurchaseService";
import { prismaTest } from "../utils/prismaTestClient";

describe("Flash Sale Purchase Service (Unit Tests)", () => {
  let redisClient: RedisClientType;
  let flashSaleId: string;
  let purchaseService: PurchaseService;

  beforeAll(async () => {
    // Connect to Redis
    redisClient = createClient({
      url: process.env.TEST_REDIS_URL || "redis://localhost:6379",
    }) as RedisClientType;

    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    await redisClient.connect();

    // Use the test prisma client
    purchaseService = new PurchaseService(prismaTest, redisClient);

    // Ensure DB is clean before tests
    await prismaTest.purchaseQueue.deleteMany();
    await prismaTest.purchase.deleteMany();
    await prismaTest.flashSale.deleteMany();
  });

  afterAll(async () => {
    // Clean DB
    await prismaTest.purchaseQueue.deleteMany();
    await prismaTest.purchase.deleteMany();
    await prismaTest.flashSale.deleteMany();

    await prismaTest.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    // Reset tables before each test
    await prismaTest.purchaseQueue.deleteMany();
    await prismaTest.purchase.deleteMany();
    await prismaTest.flashSale.deleteMany();

    // Create a test flash sale
    const flashSale = await prismaTest.flashSale.create({
      data: {
        productName: "Test Product",
        productDescription: "This is a test product",
        originalPrice: new Prisma.Decimal(1000.0),
        flashSalePrice: new Prisma.Decimal(500.0),
        currency: "USD",
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(Date.now() + 3600000),
        isActive: true,
      },
    });

    flashSaleId = flashSale.id;

    // Clear Redis cache
    await redisClient.flushAll();
  });

  // -----------------------------
  // Purchase Service Unit Tests
  // -----------------------------
  test("should successfully process a valid purchase", async () => {
    const userId = "test-user-1";

    const result = await purchaseService.attemptPurchase(userId, flashSaleId);

    expect(result).toHaveProperty("id");

    // Verify stock update
    const updatedSale = await prismaTest.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    expect(updatedSale?.remainingStock).toBe(9);

    const purchase = await prismaTest.purchase.findUnique({
      where: {
        userId_flashSaleId: { userId, flashSaleId },
      },
    });

    expect(purchase).toBeTruthy();
    expect(purchase?.status).toBe("COMPLETED");
  });

  test("should prevent duplicate purchases by same user", async () => {
    const userId = "test-user-2";

    await purchaseService.attemptPurchase(userId, flashSaleId);

    await expect(
      purchaseService.attemptPurchase(userId, flashSaleId)
    ).rejects.toThrow("User has already purchased this item");
  });

  test("should handle sold out scenario", async () => {
    await prismaTest.flashSale.update({
      where: { id: flashSaleId },
      data: { remainingStock: 0 },
    });

    const purchaseS = purchaseService.attemptPurchase(
      "test-user-3",
      flashSaleId
    );

    await expect(purchaseS).rejects.toThrow("Flash sale is not active");
  });
});
