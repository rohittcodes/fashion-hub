"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { ProductCard } from "../../_components/products";

export default function CategoryClient({ slug }: { slug: string }) {
  const trpcClient = useTRPC();
  const { data } = useSuspenseQuery(
    trpcClient.category.withProducts.queryOptions({ slug, limit: 20 }),
  );

  const category = data.category;
  const products = data.products;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">No products found</h2>
          <p className="text-muted-foreground">
            Try browsing other categories or adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                compareAtPrice: p.compareAtPrice,
                images: p.images,
                category: null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


