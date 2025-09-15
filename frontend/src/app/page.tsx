// import AdminPage from "@/components/Admin";
"use client";
import React from "react";

import dynamic from "next/dynamic";

const FlashSaleComponent = dynamic(() => import("@/components/FlashSale"), {
  ssr: false,
});

export default function Home() {
  return <FlashSaleComponent />;
}
