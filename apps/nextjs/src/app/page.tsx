import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";
import { 
  FeaturedProducts, 
  ProductCardSkeleton,
  CategoryList 
} from "./_components/products";

export default function HomePage() {
  prefetch(trpc.product.featured.queryOptions({ limit: 8 }));
  prefetch(trpc.category.all.queryOptions({ withProductCount: true }));

  return (
    <HydrateClient>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
              Fashion <span className="text-primary">Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover the latest trends in fashion
            </p>
            <AuthShowcase />
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="mb-6 text-2xl font-bold text-center">Shop by Category</h2>
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            }
          >
            <CategoryList />
          </Suspense>
        </section>

        {/* Featured Products */}
        <Suspense
          fallback={
            <section className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="mb-8 text-3xl font-bold text-center">Featured Products</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
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
