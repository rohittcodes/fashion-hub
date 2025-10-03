import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ProductList, ProductCardSkeleton, ProductSearch } from "../_components/products";

export default function ProductsPage() {
  prefetch(trpc.product.all.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">All Products</h1>
          <ProductSearch />
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <ProductList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
