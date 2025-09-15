// components/Header.tsx
"use client";

import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <Zap className="w-7 h-7 text-yellow-300" />
          <span className="text-2xl font-bold tracking-tight">
            Flash<span className="text-yellow-300">Sale</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-yellow-300 transition-colors">
            Home
          </Link>
          <Link href="#" className="hover:text-yellow-300 transition-colors">
            Sales
          </Link>
          <Link href="#" className="hover:text-yellow-300 transition-colors">
            My Orders
          </Link>
          <Link href="#" className="hover:text-yellow-300 transition-colors">
            About
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <Link
            href="/cart"
            className="flex items-center space-x-1 bg-yellow-300 text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
