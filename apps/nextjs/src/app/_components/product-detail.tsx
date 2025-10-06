"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Share2 } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useWishlist } from "~/lib/wishlist";
import { useTRPC } from "~/trpc/react";
import { SimilarItemsSection } from "./recommendations";

// Product Detail Component
export function ProductDetail(props: {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    compareAtPrice: string | null;
    inventory: number;
    images: string[] | null;
    category: { name: string } | null;
    sku: string | null;
    weight: number | string | null;
    tags: string[] | null;
    reviews: {
      id: string;
      rating: number;
      title: string | null;
      comment: string | null;
      createdAt: Date;
      user?: { name: string };
    }[];
  };
}) {
  const { product } = props;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggle } = useWishlist(product.id);

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

  const addReview = useMutation(
    trpc.product.addReview.mutationOptions({
      onSuccess: () => {
        toast.success("Review added successfully!");
        void queryClient.invalidateQueries(trpc.product.byId.queryFilter());
      },
      onError: (_err) => {
        toast.error("Failed to add review");
      },
    }),
  );

  const handleAddToCart = () => {
    if (quantity > product.inventory) {
      toast.error("Not enough inventory");
      return;
    }

    addToCart.mutate({
      productId: product.id,
      quantity,
    });
  };

  const handleAddReview = (
    rating: number,
    title?: string,
    comment?: string,
  ) => {
    addReview.mutate({
      productId: product.id,
      rating,
      title,
      comment,
    });
  };

  const images = product.images ?? [];
  const hasDiscount =
    product.compareAtPrice &&
    parseFloat(product.compareAtPrice) > parseFloat(product.price);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                onClick={() => toggle(product.id)}
                className="rounded-full bg-background/90 p-2 shadow"
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {isWishlisted ? (
                  <Heart className="h-4 w-4 text-pink-600" fill="#DB2777" />
                ) : (
                  <Heart className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <button
                className="rounded-full bg-background/90 p-2 shadow"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {images.length > 0 && images[selectedImageIndex] ? (
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-md border-2 transition-colors",
                    selectedImageIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground",
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <p className="text-sm text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-foreground">
              ${product.price}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ${product.compareAtPrice}
                </span>
                <span className="rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800">
                  Save $
                  {(
                    parseFloat(product.compareAtPrice ?? "0") -
                    parseFloat(product.price)
                  ).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">{product.description}</p>

            {product.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Weight: {product.weight ? `${product.weight} lbs` : "N/A"}
            </p>
          </div>

          {/* Inventory Status */}
          <div className="space-y-2">
            {product.inventory > 0 ? (
              <p className="text-sm text-green-600">
                {product.inventory > 10
                  ? "In Stock"
                  : `Only ${product.inventory} left in stock!`}
              </p>
            ) : (
              <p className="text-sm text-red-600">Out of Stock</p>
            )}
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={product.inventory}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setQuantity(Math.min(product.inventory, quantity + 1))
                  }
                  disabled={quantity >= product.inventory}
                >
                  +
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={addToCart.isPending || product.inventory === 0}
              className="w-full"
            >
              {product.inventory === 0
                ? "Out of Stock"
                : addToCart.isPending
                  ? "Adding..."
                  : "Add to Cart"}
            </Button>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <ProductReviews
          productId={product.id}
          reviews={product.reviews}
          onAddReview={handleAddReview}
        />
      </div>

      <div className="mt-16">
        <SimilarItemsSection productId={product.id} />
      </div>
    </div>
  );
}

// Product Reviews Component
export function ProductReviews(props: {
  productId: string;
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: Date;
    user?: { name: string };
  }[];
  onAddReview: (rating: number, title?: string, comment?: string) => void;
}) {
  const { reviews, onAddReview } = props;
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    onAddReview(rating, title || undefined, comment || undefined);
    setShowReviewForm(false);
    setRating(0);
    setTitle("");
    setComment("");
  };

  const _averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews</h2>
        <Button onClick={() => setShowReviewForm(!showReviewForm)}>
          Write a Review
        </Button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Write a Review</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      "text-2xl",
                      star <= rating ? "text-yellow-400" : "text-gray-300",
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Title (Optional)
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview}>Submit Review</Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {review.user?.name ?? "Anonymous"}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={cn(
                          "text-sm",
                          star <= review.rating
                            ? "text-yellow-400"
                            : "text-gray-300",
                        )}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              {review.title && (
                <h4 className="mt-2 font-semibold">{review.title}</h4>
              )}

              {review.comment && (
                <p className="mt-1 text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
