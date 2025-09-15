// prisma/seed.ts - Enhanced with pricing
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.info("Seeding database...");

  // Create sample flash sales with pricing
  const flashSales = [
    {
      productName: "Limited Edition Smart Watch Pro",
      productDescription:
        "Premium smartwatch with health monitoring, GPS, and 7-day battery life",
      originalPrice: 399.99,
      flashSalePrice: 199.99, // 50% off
      currency: "USD",
      totalStock: 100,
      remainingStock: 100,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      isActive: true,
    },
    {
      productName: "Wireless Gaming Headset",
      productDescription:
        "High-fidelity audio with noise cancellation and RGB lighting",
      originalPrice: 149.99,
      flashSalePrice: 79.99, // ~47% off
      currency: "USD",
      totalStock: 50,
      remainingStock: 50,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // 26 hours from now
      isActive: false, // Will be activated later
    },
    {
      productName: "Premium Laptop Stand",
      productDescription:
        "Ergonomic aluminum laptop stand with adjustable height",
      originalPrice: 89.99,
      flashSalePrice: 39.99, // ~56% off
      currency: "USD",
      totalStock: 200,
      remainingStock: 200,
      startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // 25 hours from now
      isActive: true,
    },
  ];

  const createdSales = [];

  for (const saleData of flashSales) {
    const flashSale = await prisma.flashSale.create({
      data: saleData,
    });

    const discountPercent = Math.round(
      ((saleData.originalPrice - saleData.flashSalePrice) /
        saleData.originalPrice) *
        100
    );

    console.info(`✅ Created flash sale: ${flashSale.productName}`);
    console.info(
      `   💰 Price: $${saleData.originalPrice} → $${saleData.flashSalePrice} (${discountPercent}% off)`
    );
    console.info(`   📦 Stock: ${saleData.totalStock} units`);
    console.info(
      `   ⏰ Duration: ${saleData.startTime.toLocaleString()} - ${saleData.endTime.toLocaleString()}`
    );
    console.info("");

    createdSales.push(flashSale);
  }

  // Create some sample purchases for demonstration
  if (createdSales.length > 0) {
    const samplePurchases = [
      {
        userId: "demo-user-1",
        flashSaleId: createdSales[0].id,
        pricePaid: createdSales[0].flashSalePrice,
        originalPrice: createdSales[0].originalPrice,
        currency: createdSales[0].currency,
      },
      {
        userId: "demo-user-2",
        flashSaleId: createdSales[0].id,
        pricePaid: createdSales[0].flashSalePrice,
        originalPrice: createdSales[0].originalPrice,
        currency: createdSales[0].currency,
      },
    ];

    for (const purchaseData of samplePurchases) {
      await prisma.purchase.create({
        data: purchaseData,
      });

      // Update remaining stock
      await prisma.flashSale.update({
        where: { id: purchaseData.flashSaleId },
        data: {
          remainingStock: {
            decrement: 1,
          },
        },
      });
    }

    console.info(`✅ Created ${samplePurchases.length} sample purchases`);
  }

  console.info("");
  console.info("🎉 Seeding completed successfully!");
  console.info("");
  console.info("📊 Summary:");
  console.info(`   Flash Sales Created: ${createdSales.length}`);
  console.info(
    `   Total Available Products: ${createdSales.reduce(
      (sum, sale) => sum + sale.totalStock,
      0
    )}`
  );
  console.info(
    `   Active Sales: ${createdSales.filter((sale) => sale.isActive).length}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
