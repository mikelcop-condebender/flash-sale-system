export type SaleStatus = {
  id: string;
  productName: string;
  totalStock: number;
  remainingStock: number;
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "ended" | "sold_out";
  soldCount: number;
  soldPercentage: number;
};

export type PurchaseResult = {
  success: boolean;
  message: string;
  data?: {
    purchaseId: string;
    remainingStock: number;
    purchasedAt: string;
  };
};

export type FlashSale = {
  id: string;
  productName: string;
  productDescription: string;
  originalPrice: number;
  flashSalePrice: number;
  currency: string;
  totalStock: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};
