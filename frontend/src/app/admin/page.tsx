// import AdminPage from "@/components/Admin";
"use client";
import React from "react";

import dynamic from "next/dynamic";

// This tells Next.js: render only on the client (no SSR)
const AdminPage = dynamic(() => import("@/components/Admin"), {
  ssr: false,
});

const Admin = () => {
  return <AdminPage />;
};

export default Admin;
