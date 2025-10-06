"use client";

import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { ProductDetail } from "../../_components/product-detail";

export default function ProductClient({ slug }: { slug: string }) {
  const trpcClient = useTRPC();
  const { data: basic } = useSuspenseQuery(
    trpcClient.product.bySlug.queryOptions({ slug }),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">{basic.name}</h1>
      {basic.description ? (
        <p className="text-muted-foreground">{basic.description}</p>
      ) : null}
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="text-muted-foreground">Loading details…</div>
          }
        >
          <DetailQuery id={basic.id} />
        </Suspense>
      </div>
    </div>
  );
}

function DetailQuery({ id }: { id: string }) {
  const trpcClient = useTRPC();
  const { data } = useSuspenseQuery(
    trpcClient.product.byId.queryOptions({ id }),
  );
  return <ProductDetail product={data} />;
}
