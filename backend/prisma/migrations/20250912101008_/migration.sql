-- CreateEnum
CREATE TYPE "public"."PurchaseStatus" AS ENUM ('COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."flash_sales" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "flashSalePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalStock" INTEGER NOT NULL,
    "remainingStock" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashSaleId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "originalPrice" DECIMAL(10,2),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashSaleId" TEXT NOT NULL,
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "public"."purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_flashSaleId_idx" ON "public"."purchases"("flashSaleId");

-- CreateIndex
CREATE INDEX "purchases_purchasedAt_idx" ON "public"."purchases"("purchasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_userId_flashSaleId_key" ON "public"."purchases"("userId", "flashSaleId");

-- CreateIndex
CREATE INDEX "purchase_queue_status_createdAt_idx" ON "public"."purchase_queue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "purchase_queue_userId_idx" ON "public"."purchase_queue"("userId");

-- AddForeignKey
ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "public"."flash_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_queue" ADD CONSTRAINT "purchase_queue_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "public"."flash_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
