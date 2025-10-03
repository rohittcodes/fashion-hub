import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ProductCardSkeleton } from "../../_components/products";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  
  // Prefetch the category data
  prefetch(trpc.category.withProducts.queryOptions({ 
    slug,
    limit: 20 
  }));

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted mb-4" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <CategoryPageWrapper slug={slug} />
      </Suspense>
    </HydrateClient>
  );
}

function CategoryPageWrapper({ slug: _slug }: { slug: string }) {
  // This is a placeholder that will be replaced by client-side data fetching
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p>Loading category...</p>
      </div>
    </div>
  );
}
