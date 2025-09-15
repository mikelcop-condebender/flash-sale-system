import { PurchaseStatus, QueueStatus } from "@prisma/client";

export type FlashSale = {
  id: string;
  productName: string;
  totalStock: number;
  remainingStock: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Purchase = {
  id: string;
  userId: string;
  flashSaleId: string;
  purchasedAt: Date;
  status: PurchaseStatus;
};

export type PurchaseQueue = {
  id: string;
  userId: string;
  flashSaleId: string;
  status: QueueStatus;
  createdAt: Date;
  processedAt: Date | null;
};

// Extended types for queries with relations
export type FlashSaleWithPurchaseCount = FlashSale & {
  _count: {
    purchases: number;
  };
};

export type FlashSaleWithPurchases = FlashSale & {
  purchases: PurchaseForAnalytics[];
};

export type PurchaseForAnalytics = {
  id: string;
  userId: string;
  purchasedAt: Date;
  status: PurchaseStatus;
};

export type SaleStatistics = FlashSaleWithPurchaseCount & {
  soldCount: number;
  purchaseCount: number;
  soldPercentage: number;
};

export type FlashSaleAnalytics = {
  flashSale: {
    id: string;
    productName: string;
    totalStock: number;
    remainingStock: number;
    soldCount: number;
    soldPercentage: number;
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  purchases: {
    total: number;
    successful: number;
    failed: number;
    firstPurchase?: Date;
    lastPurchase?: Date;
  };
  timeline: Record<string, number>;
};

export type PurchaseTimelineAccumulator = Record<string, number>;

export type SuccessResponse<T = any> = {
  success: true;
  message?: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
  code?: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export type CreateFlashSaleBody = {
  productName: string;
  productDescription?: string;
  originalPrice: number;
  flashSalePrice: number;
  currency?: string;
  totalStock: number;
  startTime: string;
  endTime: string;
};

export type UpdateFlashSaleBody = CreateFlashSaleBody;

export type ActivateFlashSaleBody = {
  isActive: boolean;
};

export type FlashSaleParams = {
  id: string;
};

export type SaleStatusParams = {
  flashSaleId: string;
};

export type PurchaseRequestBody = {
  userId: string;
  flashSaleId: string;
};

export type PurchaseStatusParams = {
  userId: string;
  flashSaleId: string;
};
