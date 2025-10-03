import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CartPage } from "../_components/cart";

export default function CartPageRoute() {
  prefetch(trpc.cart.get.queryOptions());

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                    <div className="h-20 w-20 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
              <div className="h-64 animate-pulse rounded-lg border bg-muted" />
            </div>
          </div>
        }
      >
        <CartPage />
      </Suspense>
    </HydrateClient>
  );
}
