"use client";
/*
  Local disable for unsafe rules: trpc helper types flow correctly but eslint
  cannot fully infer them through generic helpers, so accessing fields is
  flagged. The data shapes are enforced by RouterOutputs.
*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Flame, Sparkles } from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "./products";
import { useRecommendationTracking } from "~/lib/recommendations";
import { useTRPC } from "~/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { UseSuspenseQueryOptions } from "@tanstack/react-query";
import type { RouterOutputs } from "@acme/api";

const sectionGradient =
  "bg-gradient-to-br from-pink-50 via-white to-white dark:from-[#241a2b] dark:via-[#1a1420] dark:to-[#130f17]";

type RecommendationEntry = RouterOutputs["recommendation"]["forYou"][number];

type SectionState = "loading" | "empty" | "error" | "ready";

interface SectionProps {
  title: string;
  description: string;
  entries: RecommendationEntry[];
  variant: "for-you" | "trending" | "similar";
  state: SectionState;
  onRetry?: () => void;
};

const reasonBadge: Record<SectionProps["variant"], { label: string; icon: ReactNode }> = {
  "for-you": {
    label: "Personalized",
    icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
  },
  trending: {
    label: "Trending",
    icon: <Flame className="h-4 w-4" aria-hidden="true" />,
  },
  similar: {
    label: "Similar",
    icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
  },
};

export function RecommendationSection(props: SectionProps) {
  const { title, description, entries, state, variant, onRetry } = props;
  const { track } = useRecommendationTracking();

  useEffect(() => {
    if (state !== "ready") return;
    for (const entry of entries) {
      track(entry.product.id, "view", { variant });
    }
  }, [entries, state, track, variant]);

  const content = useMemo(() => {
    if (state === "loading") {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" role="status" aria-live="polite">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (state === "error") {
      return (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-pink-100/50 bg-white/60 p-8 text-center shadow-sm dark:border-pink-500/20 dark:bg-black/20">
          <AlertTriangle className="h-10 w-10 text-pink-500" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">We couldn't load your picks.</p>
            <p className="text-sm text-muted-foreground">Give it another try in a moment.</p>
          </div>
          {onRetry ? (
            <button
              onClick={onRetry}
              className="rounded-full bg-pink-200 px-5 py-2 text-sm font-medium text-pink-900 transition hover:bg-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400"
            >
              Retry
            </button>
          ) : null}
        </div>
      );
    }

    if (state === "empty") {
      return (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-pink-200/70 bg-white/60 p-10 text-center shadow-sm dark:border-pink-500/30 dark:bg-black/10">
          <Sparkles className="h-10 w-10 text-pink-400" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">We're warming up ideas.</p>
            <p className="text-sm text-muted-foreground">
              Explore the catalog to teach Fashion Hub what you love.
            </p>
          </div>
          <Link
            href="/products"
            className="rounded-full bg-pink-200 px-6 py-2 text-sm font-semibold text-pink-900 transition hover:bg-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400"
          >
            Browse products
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {entries.map((entry) => (
          <div key={entry.product.id} className="group focus-within:shadow-lg">
            <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-pink-200/80 px-3 py-1 text-xs font-semibold text-pink-900 shadow-sm">
              {reasonBadge[variant].icon}
              <span className="sr-only">Recommendation type:</span>
              <span>{reasonBadge[variant].label}</span>
            </div>
            <ProductCard
              product={{
                id: entry.product.id,
                name: entry.product.name,
                slug: entry.product.slug,
                description: null,
                price: entry.product.price,
                compareAtPrice: entry.product.compareAtPrice,
                inventory: undefined,
                images: entry.product.images,
                category: entry.product.category
                  ? { name: entry.product.category.name }
                  : null,
              }}
            />
          </div>
        ))}
      </div>
    );
  }, [entries, onRetry, state, variant]);

  return (
    <section className={`rounded-[1.75rem] ${sectionGradient} px-6 py-8 shadow-[0_18px_48px_-24px_rgba(110,20,70,0.35)] lg:px-10 lg:py-10`} aria-labelledby={`${variant}-heading`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`${variant}-heading`} className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {variant === "trending" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-200/60 bg-white/70 px-4 py-1 text-xs font-medium text-pink-700 shadow-sm dark:border-pink-400/30 dark:bg-pink-950/30 dark:text-pink-200">
            <Flame className="h-4 w-4" aria-hidden="true" /> Hot this week
          </span>
        ) : null}
      </div>
      {content}
    </section>
  );
}

export function ForYouSection() {
  const trpc = useTRPC();
  const options = trpc.recommendation.forYou.queryOptions({ limit: 8 }) as unknown as UseSuspenseQueryOptions<RecommendationEntry[], Error, RecommendationEntry[], readonly unknown[]>;
  const { data, refetch } = useSuspenseQuery(options);

  const state: SectionState = data.length === 0 ? "empty" : "ready";

  return (
    <RecommendationSection
      title="For You"
      description="Handpicked suggestions blending your recent looks with pieces other style lovers adore."
      entries={data}
      state={state}
      variant="for-you"
      onRetry={refetch}
    />
  );
}

export function TrendingSection() {
  const trpc = useTRPC();
  const options = trpc.recommendation.trending.queryOptions({ limit: 8 }) as unknown as UseSuspenseQueryOptions<RecommendationEntry[], Error, RecommendationEntry[], readonly unknown[]>;
  const { data, refetch } = useSuspenseQuery(options);

  const state: SectionState = data.length === 0 ? "empty" : "ready";

  return (
    <RecommendationSection
      title="Trending Now"
      description="What's capturing carts, hearts, and wishlists across Fashion Hub right now."
      entries={data}
      state={state}
      variant="trending"
      onRetry={refetch}
    />
  );
}

export function SimilarItemsSection(props: { productId: string; title?: string }) {
  const trpc = useTRPC();
  const options = props.productId
    ? trpc.recommendation.similar.queryOptions({ productId: props.productId, limit: 6 })
    : ({
        queryKey: ["recommendation", "similar", "none"] as const,
        queryFn: async () => await Promise.resolve([] as RecommendationEntry[]),
      } satisfies UseSuspenseQueryOptions<RecommendationEntry[], Error, RecommendationEntry[], readonly unknown[]>);

  const { data, refetch } = useSuspenseQuery(options as unknown as UseSuspenseQueryOptions<RecommendationEntry[], Error, RecommendationEntry[], readonly unknown[]>);

  const state: SectionState = data.length === 0 ? "empty" : "ready";

  return (
    <RecommendationSection
      title={props.title ?? "Similar Items"}
      description="Styled like your current pick - fresh hues, silhouettes, and details you'll appreciate."
      entries={data}
      state={state}
      variant="similar"
      onRetry={refetch}
    />
  );
}
