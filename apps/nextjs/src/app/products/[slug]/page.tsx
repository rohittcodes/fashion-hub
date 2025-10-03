import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage(props: ProductPageProps) {
  const { slug } = await props.params;

  // Prefetch the product data
  prefetch(trpc.product.bySlug.queryOptions({ slug }));

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-lg bg-muted" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        }
      >
        <ProductDetailWrapper slug={slug} />
      </Suspense>
    </HydrateClient>
  );
}

function ProductDetailWrapper({ slug: _slug }: { slug: string }) {
  // This is a server component that will be replaced by client-side data fetching
  // For now, we'll return a placeholder that will be hydrated with real data
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p>Loading product details...</p>
      </div>
    </div>
  );
}
