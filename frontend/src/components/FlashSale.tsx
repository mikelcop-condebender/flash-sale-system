"use client";
import React, { useState, useEffect } from "react";
import {
  Clock,
  ShoppingCart,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PurchaseResult, SaleStatus } from "@/types";
import { api } from "@/lib/api";

const FlashSaleComponent: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [sales, setSales] = useState<SaleStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [timers, setTimers] = useState<
    Record<string, { hours: number; minutes: number; seconds: number } | null>
  >({});

  // Fetch all active sales
  const fetchSaleStatus = async () => {
    try {
      setLoading(true);
      const response = (await api.getActiveSales()) as any;
      setSales(response.data); // expect array of SaleStatus
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load sales" });
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase attempt for a specific sale
  const handlePurchase = async (saleId: string) => {
    if (!userId.trim()) {
      setMessage({ type: "error", text: "Please enter your user ID" });
      return;
    }

    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status !== "active") {
      setMessage({ type: "error", text: "Sale is not currently active" });
      return;
    }

    setPurchasing(saleId);
    setMessage(null);

    try {
      const result = (await api.attemptPurchase(
        userId,
        saleId
      )) as PurchaseResult;
      setMessage({
        type: "success",
        text: `Success! ${result.data?.remainingStock} items remaining`,
      });
      await fetchSaleStatus();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Purchase failed. Please try again.",
      });
    } finally {
      setPurchasing(null);
    }
  };

  // Update countdown timers for all sales
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date().getTime();
      const newTimers: typeof timers = {};

      sales.forEach((sale) => {
        const endTime = new Date(sale.endTime).getTime();
        const difference = endTime - now;

        if (difference > 0 && sale.status === "active") {
          newTimers[sale.id] = {
            hours: Math.floor(difference / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
          };
        } else {
          newTimers[sale.id] = null;
        }
      });

      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [sales]);

  // Auto-refresh sales
  useEffect(() => {
    fetchSaleStatus();
    const interval = setInterval(fetchSaleStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "upcoming":
        return "text-blue-600 bg-blue-50";
      case "ended":
        return "text-red-600 bg-red-50";
      case "sold_out":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5" />;
      case "upcoming":
        return <Clock className="w-5 h-5" />;
      case "ended":
        return <XCircle className="w-5 h-5" />;
      case "sold_out":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Flash Sales</h1>
        <p className="text-gray-600">
          Limited time, limited stock - grab yours fast!
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User ID / Email (Mock Logged User here)
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID or email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : message.type === "error" ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {sales.map((sale) => (
        <div
          key={sale.id}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          {/* Product Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{sale.productName}</h2>
                <p className="text-blue-100">
                  Premium quality, limited availability
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(
                  sale.status
                )}`}
              >
                {getStatusIcon(sale.status)}
                <span className="font-medium capitalize">
                  {sale.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Sale Stats */}
          <div className="p-6 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sale.totalStock}
              </div>
              <div className="text-sm text-gray-600">Total Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sale.remainingStock}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sale.soldCount}
              </div>
              <div className="text-sm text-gray-600">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sale.soldPercentage}%
              </div>
              <div className="text-sm text-gray-600">Sold Out</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${sale.soldPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Countdown Timer */}
          {timers[sale.id] && sale.status === "active" && (
            <div className="px-6 pb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4">
                  <Clock className="w-5 h-5 text-red-600" />
                  <div className="text-red-800 font-medium">
                    Time remaining:{" "}
                    {timers[sale.id]?.hours.toString().padStart(2, "0")}:
                    {timers[sale.id]?.minutes.toString().padStart(2, "0")}:
                    {timers[sale.id]?.seconds.toString().padStart(2, "0")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <div className="p-6 border-t">
            <button
              onClick={() => handlePurchase(sale.id)}
              disabled={
                purchasing === sale.id ||
                !userId.trim() ||
                sale.status !== "active" ||
                sale.remainingStock <= 0
              }
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                purchasing === sale.id ||
                !userId.trim() ||
                sale.status !== "active" ||
                sale.remainingStock <= 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {purchasing === sale.id ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy Now</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Updates Notice */}
          <div className="px-6 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-800 text-sm">
                <Users className="w-4 h-4" />
                <span>Live updates every 5 seconds • High demand expected</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlashSaleComponent;
