import { Suspense } from "react";
import Link from "next/link";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";

import {
  CategoryGrid,
  FeaturedProducts,
  ProductCardSkeleton,
} from "./_components/products";
import { ForYouSection, TrendingSection } from "./_components/recommendations";

export default function HomePage() {
  prefetch(trpc.product.featured.queryOptions({ limit: 8 }));
  prefetch(trpc.category.all.queryOptions({ withProductCount: true }));

  return (
    <HydrateClient>
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
              <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
                Elevate Your Style with <span className="text-primary">Fashion Hub</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover curated collections, trending pieces, and exclusive drops &mdash; all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Shop Now
                </Link>
                <Link
                  href="#categories"
                  className="rounded-lg border px-6 py-3 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="categories" className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Shop by Category</h2>
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            }
          >
            <CategoryGrid />
          </Suspense>
        </section>
        <section className="container mx-auto space-y-10 px-4 pb-12">
          <ForYouSection />
          <TrendingSection />
        </section>
        {/* Featured */}
        <Suspense
          fallback={
            <section className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="mb-8 text-center text-3xl font-bold">Featured Products</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </section>
          }
        >
          <FeaturedProducts />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
