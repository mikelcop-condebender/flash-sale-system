/*
  Warnings:

  - Added the required column `pricePaid` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."purchases" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "pricePaid" DECIMAL(10,2) NOT NULL;
