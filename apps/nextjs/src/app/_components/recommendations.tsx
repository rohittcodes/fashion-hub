"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Heart, ShoppingCart, TrendingUp, Sparkles, Eye } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { useWishlist } from "~/lib/wishlist";

/**
 * Fashion Hub Recommendation Components
 * Styled with: soft pink accents, rounded-2xl, subtle gradients, soft shadows
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  inventory: number;
  images: string[] | null;
  isFeatured: boolean;
  tags: string[] | null;
}

interface RecommendationCardProps {
  product: RecommendedProduct;
  source: "forYou" | "similar" | "trending";
  onInteraction?: (productId: string, type: string) => void;
}

interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Recommendation Card Component
// ============================================================================

export function RecommendationCard({
  product,
  source,
  onInteraction,
}: RecommendationCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isWishlisted, toggle } = useWishlist(product.id);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wish = mounted && isWishlisted;

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        toast.success("Added to cart!");
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
        onInteraction?.(product.id, "cart");
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart",
        );
      },
    }),
  );

  const handleCardClick = () => {
    onInteraction?.(product.id, "view");
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    onInteraction?.(product.id, wish ? "remove_wishlist" : "wishlist");
  };

  const hasDiscount =
    product.compareAtPrice &&
    parseFloat(product.compareAtPrice) > parseFloat(product.price);

  const discountPercentage = hasDiscount
    ? Math.round(
        ((parseFloat(product.compareAtPrice ?? "0") -
          parseFloat(product.price)) /
          parseFloat(product.compareAtPrice ?? "1")) *
          100,
      )
    : 0;

  const imageUrl =
    product.images && product.images.length > 0 && !imageError
      ? product.images[0]
      : `https://placehold.co/400x400/fce7f3/ec4899.png?text=${encodeURIComponent(product.name)}`;

  return (
    <Link href={`/products/${product.slug}`} onClick={handleCardClick}>
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl",
          "border border-neutral-200 bg-white shadow-sm",
          "transition-all duration-250 hover:shadow-md hover:-translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
        )}
        aria-label={`${product.name} - ${source} recommendation`}
      >
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100">
          {/* Badges */}
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {hasDiscount && (
              <span
                className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                aria-label={`${discountPercentage}% discount`}
              >
                -{discountPercentage}%
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              "absolute right-2 top-2 z-10 rounded-full p-2 shadow-md",
              "bg-white/95 backdrop-blur-sm transition-all duration-200",
              "hover:scale-110 hover:bg-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
            )}
            aria-label={
              wish ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                wish ? "fill-pink-600 text-pink-600" : "text-neutral-600",
              )}
            />
          </button>

          {/* Product Image */}
          <Image
            src={imageUrl}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />

          {/* Quick Add to Cart */}
          <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              onClick={handleAddToCart}
              disabled={addToCart.isPending || product.inventory === 0}
              className={cn(
                "w-full rounded-xl bg-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg",
                "hover:bg-pink-700 active:scale-95",
                "disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.inventory === 0
                ? "Out of Stock"
                : addToCart.isPending
                  ? "Adding..."
                  : "Quick Add"}
            </Button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col p-4">
          {/* Product Name */}
          <h3 className="mb-1 line-clamp-2 text-base font-semibold text-neutral-900">
            {product.name}
          </h3>

          {/* Product Description */}
          {product.description && (
            <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-900">
                ${product.price}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-neutral-500 line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>

            {/* Stock Warning */}
            {product.inventory > 0 && product.inventory < 10 && (
              <span className="text-xs font-medium text-orange-600">
                {product.inventory} left
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================================
// Recommendation Card Skeleton
// ============================================================================

export function RecommendationCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
      role="status"
      aria-label="Loading recommendation"
    >
      <div className="aspect-square w-full animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="mb-3 h-4 w-full animate-pulse rounded bg-neutral-200" />
        <div className="mb-3 flex gap-1">
          <div className="h-5 w-12 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-neutral-200" />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="h-6 w-20 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recommendation Section Container
// ============================================================================

export function RecommendationSection({
  title,
  subtitle,
  icon,
  children,
  className,
}: RecommendationSectionProps) {
  return (
    <section className={cn("py-8", className)} aria-labelledby="section-title">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 text-pink-600">
                {icon}
              </div>
            )}
            <div>
              <h2
                id="section-title"
                className="text-2xl font-bold text-neutral-900 sm:text-3xl"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}

// ============================================================================
// For You Section
// ============================================================================

export function ForYouSection() {
  const trpc = useTRPC();
  const { data: recommendations, isLoading } = useQuery(
    trpc.recommendation.getForYou.queryOptions({
      limit: 12,
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackInteraction.mutationOptions(),
  );

  const handleInteraction = (productId: string, type: string) => {
    trackInteraction.mutate({
      productId,
      interactionType: type as
        | "view"
        | "cart"
        | "purchase"
        | "wishlist"
        | "remove_wishlist"
        | "remove_cart",
      metadata: { source: "for-you-section" },
    });
  };

  if (isLoading) {
    return (
      <RecommendationSection
        title="For You"
        subtitle="Personalized picks just for you"
        icon={<Sparkles className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      </RecommendationSection>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <RecommendationSection
        title="For You"
        subtitle="Personalized picks just for you"
        icon={<Sparkles className="h-5 w-5" />}
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          <Eye className="mb-4 h-12 w-12 text-neutral-400" />
          <p className="text-lg font-semibold text-neutral-700">
            Start exploring to get personalized recommendations
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Browse products and we'll learn your style preferences
          </p>
          <Link href="/products">
            <Button className="mt-6 rounded-xl bg-pink-600 hover:bg-pink-700">
              Browse Products
            </Button>
          </Link>
        </div>
      </RecommendationSection>
    );
  }

  return (
    <RecommendationSection
      title="For You"
      subtitle="Personalized picks based on your style"
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        {recommendations.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="forYou"
            onInteraction={handleInteraction}
          />
        ))}
      </div>
    </RecommendationSection>
  );
}

// ============================================================================
// Similar Products Section
// ============================================================================

export function SimilarProductsSection({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const { data: similarProducts, isLoading } = useSuspenseQuery(
    trpc.recommendation.getSimilarProducts.queryOptions({
      productId,
      limit: 8,
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackSessionInteraction.mutationOptions(),
  );

  const handleInteraction = (productId: string, type: string) => {
    const sessionId = getOrCreateSessionId();
    trackInteraction.mutate({
      productId,
      interactionType: type as
        | "view"
        | "cart"
        | "purchase"
        | "wishlist"
        | "remove_wishlist"
        | "remove_cart",
      sessionId,
      metadata: { source: "similar-products-section" },
    });
  };

  if (isLoading) {
    return (
      <RecommendationSection
        title="Similar Items"
        subtitle="You might also like these"
        icon={<Heart className="h-5 w-5" />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      </RecommendationSection>
    );
  }

  if (!similarProducts || similarProducts.length === 0) {
    return null;
  }

  return (
    <RecommendationSection
      title="Similar Items"
      subtitle="You might also like these"
      icon={<Heart className="h-5 w-5" />}
    >
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
        role="list"
      >
        {similarProducts.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="similar"
            onInteraction={handleInteraction}
          />
        ))}
      </div>
    </RecommendationSection>
  );
}

// ============================================================================
// Trending Section
// ============================================================================

export function TrendingSection() {
  const trpc = useTRPC();
  const { data: trendingProducts, isLoading } = useQuery(
    trpc.recommendation.getTrending.queryOptions({
      limit: 12,
      timeWindow: "24h",
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackSessionInteraction.mutationOptions(),
  );

  const handleInteraction = (productId: string, type: string) => {
    const sessionId = getOrCreateSessionId();
    trackInteraction.mutate({
      productId,
      interactionType: type as
        | "view"
        | "cart"
        | "purchase"
        | "wishlist"
        | "remove_wishlist"
        | "remove_cart",
      sessionId,
      metadata: { source: "trending-section" },
    });
  };

  if (isLoading) {
    return (
      <RecommendationSection
        title="Trending Now"
        subtitle="What everyone's loving right now"
        icon={<TrendingUp className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      </RecommendationSection>
    );
  }

  if (!trendingProducts || trendingProducts.length === 0) {
    return null;
  }

  return (
    <RecommendationSection
      title="Trending Now"
      subtitle="What everyone's loving right now"
      icon={<TrendingUp className="h-5 w-5" />}
      className="bg-gradient-to-b from-pink-50/50 to-white"
    >
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        {trendingProducts.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="trending"
            onInteraction={handleInteraction}
          />
        ))}
      </div>
    </RecommendationSection>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function getOrCreateSessionId(): string {
  const key = "fashion-hub-session-id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}
