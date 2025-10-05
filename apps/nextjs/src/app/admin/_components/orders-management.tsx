"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

 

export function OrdersManagement() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const { data: orders, isLoading } = useQuery(
    trpc.order.getAll.queryOptions({ limit: 100, status: statusFilter === "all" ? undefined : statusFilter }),
  );

  const updateStatus = useMutation(
    trpc.order.updateStatus.mutationOptions({
      onSuccess: () => void queryClient.invalidateQueries(trpc.order.getAll.queryFilter()),
    }),
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-slate-600"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-slate-600"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Orders</h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600 bg-slate-800">
            {orders?.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-white">{o.orderNumber}</div>
                  <div className="text-xs text-slate-400">{o.id}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-slate-600 px-2 py-1 text-xs font-semibold text-slate-200">{o.status}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                  {o.currency} {o.total}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                  {(o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt)).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    {(["pending","processing","shipped","delivered","cancelled"] as OrderStatus[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={o.status === s ? "outline" : "secondary"}
                        onClick={() => updateStatus.mutate({ orderId: o.id, status: s })}
                        disabled={updateStatus.isPending || o.status === s}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


