"use client";

import { useState } from "react";

import { ProductManagement } from "./_components/product-management";
import { UserManagement } from "./_components/user-management";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "products">("users");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage users, products, and system settings
          </p>
        </div>

        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "products"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Product Management
            </button>
          </nav>
        </div>

        <div className="rounded-lg bg-white shadow">
          {activeTab === "users" && <UserManagement />}
          {activeTab === "products" && <ProductManagement />}
        </div>
      </div>
    </div>
  );
}
