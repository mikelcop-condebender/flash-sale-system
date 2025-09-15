// src/lib/api.ts
import axios from "axios";
import { PurchaseResult, SaleStatus } from "@/types";
import { BACKEND_URL } from "@/constants";

// Create an axios instance
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Disable cache for live data (useful in Next.js)
  // Note: axios itself doesn't cache responses, but we can send headers
  withCredentials: false,
});

export const api = {
  // ✅ Fetch all active sales
  getActiveSales: async (): Promise<{ data: SaleStatus[] }> => {
    try {
      const res = await apiClient.get(`/api/sale/active`, {
        headers: { "Cache-Control": "no-store" },
      });
      return res.data;
    } catch (err) {
      throw new Error("Failed to fetch active sales");
    }
  },
  getSaleStatus: async (flashSaleId: string): Promise<{ data: SaleStatus }> => {
    try {
      const res = await apiClient.get(`/api/sale/status/${flashSaleId}`, {
        headers: { "Cache-Control": "no-store" },
      });
      return res.data;
    } catch (err) {
      throw new Error("Failed to fetch sale status");
    }
  },

  attemptPurchase: async (
    userId: string,
    flashSaleId: string
  ): Promise<PurchaseResult> => {
    try {
      const res = await apiClient.post(`/api/purchase`, {
        userId,
        flashSaleId,
      });
      if (!res.data.success) {
        throw new Error(res.data.message || "Purchase failed");
      }
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Purchase failed");
    }
  },

  getUserPurchaseStatus: async (
    userId: string,
    flashSaleId: string
  ): Promise<{ data: any }> => {
    try {
      const res = await apiClient.get(
        `/api/purchase/status/${userId}/${flashSaleId}`,
        { headers: { "Cache-Control": "no-store" } }
      );
      return res.data;
    } catch (err) {
      throw new Error("Failed to fetch purchase status");
    }
  },
};
