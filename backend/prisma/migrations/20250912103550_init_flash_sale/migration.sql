/*
  Warnings:

  - The values [REFUNDED,CANCELLED] on the enum `PurchaseStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `currency` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `pricePaid` on the `purchases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,version]` on the table `flash_sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PurchaseStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."purchases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."purchases" ALTER COLUMN "status" TYPE "public"."PurchaseStatus_new" USING ("status"::text::"public"."PurchaseStatus_new");
ALTER TYPE "public"."PurchaseStatus" RENAME TO "PurchaseStatus_old";
ALTER TYPE "public"."PurchaseStatus_new" RENAME TO "PurchaseStatus";
DROP TYPE "public"."PurchaseStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."purchase_queue_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."purchase_queue_userId_idx";

-- DropIndex
DROP INDEX "public"."purchases_flashSaleId_idx";

-- DropIndex
DROP INDEX "public"."purchases_purchasedAt_idx";

-- DropIndex
DROP INDEX "public"."purchases_userId_idx";

-- AlterTable
ALTER TABLE "public"."flash_sales" ALTER COLUMN "version" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."purchase_queue" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."purchases" DROP COLUMN "currency",
DROP COLUMN "originalPrice",
DROP COLUMN "pricePaid",
ALTER COLUMN "status" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "flash_sales_id_version_key" ON "public"."flash_sales"("id", "version");
