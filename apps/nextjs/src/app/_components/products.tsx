"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useWishlist } from "~/lib/wishlist";
import { useTRPC } from "~/trpc/react";

// Product Card Component
export function ProductCard(props: {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    compareAtPrice: string | null;
    inventory?: number;
    images: string[] | null;
    category: { name: string } | null;
  };
}) {
  const { product } = props;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isWishlisted, toggle } = useWishlist(product.id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const wish = mounted && isWishlisted;

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        toast.success("Added to cart!");
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
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

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-2 shadow"
            aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={
                wish ? "h-4 w-4 text-pink-600" : "h-4 w-4 text-muted-foreground"
              }
              fill={wish ? "#DB2777" : "none"}
            />
          </button>
          {product.images && product.images.length > 0 && product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={300}
              height={300}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2">
          {product.category && (
            <span className="text-xs text-muted-foreground">
              {product.category.name}
            </span>
          )}
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-foreground hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              ${product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || (product.inventory ?? 0) === 0}
          >
            {(product.inventory ?? 0) === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>

        {(product.inventory ?? 0) > 0 && (product.inventory ?? 0) < 10 && (
          <p className="mt-2 text-xs text-orange-600">
            Only {product.inventory} left in stock!
          </p>
        )}
      </div>
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className={cn("aspect-square bg-muted", pulse && "animate-pulse")} />
      <div className="p-4">
        <div
          className={cn(
            "mb-2 h-3 w-1/4 rounded bg-muted",
            pulse && "animate-pulse",
          )}
        />
        <div
          className={cn(
            "mb-1 h-5 w-3/4 rounded bg-muted",
            pulse && "animate-pulse",
          )}
        />
        <div
          className={cn(
            "mb-3 h-4 w-full rounded bg-muted",
            pulse && "animate-pulse",
          )}
        />
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "h-6 w-16 rounded bg-muted",
              pulse && "animate-pulse",
            )}
          />
          <div
            className={cn(
              "h-8 w-20 rounded bg-muted",
              pulse && "animate-pulse",
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Product List Component
export function ProductList(props: {
  categoryId?: string;
  search?: string;
  isFeatured?: boolean;
}) {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.product.all.queryOptions({
      limit: 20,
      categoryId: props.categoryId,
      search: props.search,
      isFeatured: props.isFeatured,
    }),
  );

  if (products.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <ProductCardSkeleton pulse={false} />
        <ProductCardSkeleton pulse={false} />
        <ProductCardSkeleton pulse={false} />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Product Search Component
export function ProductSearch() {
  const [search, setSearch] = useState("");
  const [_debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="w-full max-w-md">
      <Input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

// Featured Products Component
export function FeaturedProducts() {
  const trpc = useTRPC();
  const { data: featuredProducts } = useSuspenseQuery(
    trpc.product.featured.queryOptions({ limit: 8 }),
  );

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Category List Component
export function CategoryList() {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(
    trpc.category.all.queryOptions({ withProductCount: true }),
  );

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

export function CategoryGrid() {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(
    trpc.category.all.queryOptions({
      includeInactive: false,
      withProductCount: true,
    }),
  );

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No categories available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {categories.slice(0, 12).map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.slug}`}
          className="group overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md"
        >
          <div className="aspect-square overflow-hidden bg-muted">
            <ImageWrapper src={c.image} alt={c.name} />
          </div>
          <div className="p-3">
            <p className="line-clamp-1 font-medium">{c.name}</p>
            {"productCount" in (c as Record<string, unknown>) &&
            typeof (c as Record<string, unknown>).productCount === "number" ? (
              <p className="text-xs text-muted-foreground">
                {(c as unknown as { productCount: number }).productCount}{" "}
                products
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ImageWrapper({ alt }: { src?: string | null; alt: string }) {
  const url = `https://placehold.co/600x600/fce7f3/9d174d.png?text=${encodeURIComponent(alt)}`;
  return (
    <Image
      src={url}
      alt={alt}
      className="h-full w-full object-cover transition-transform group-hover:scale-105"
      width={600}
      height={600}
    />
  );
}
