"use client";

import { useState } from "react";

import { CategoryManagement } from "./_components/category-management";
import { OrdersManagement } from "./_components/orders-management";
import { ProductManagement } from "./_components/product-management";
import { UserManagement } from "./_components/user-management";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "users" | "products" | "orders" | "categories"
  >("users");

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-slate-300">
            Manage users, products, and system settings
          </p>
        </div>

        <div className="mb-8 border-b border-slate-700">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "products"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              Product Management
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "orders"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "categories"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              Categories
            </button>
          </nav>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          {activeTab === "users" && <UserManagement />}
          {activeTab === "products" && <ProductManagement />}
          {activeTab === "orders" && <OrdersManagement />}
          {activeTab === "categories" && <CategoryManagement />}
        </div>
      </div>
    </div>
  );
}
