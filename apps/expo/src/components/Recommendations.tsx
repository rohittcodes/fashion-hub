import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { useWishlist } from "~/utils/wishlist-store";
import { getBaseUrl } from "~/utils/base-url";

/**
 * Fashion Hub Recommendation Components - Mobile (Expo + NativeWind)
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
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  backgroundColor?: string;
}

// ============================================================================
// Recommendation Card Component
// ============================================================================

export function RecommendationCard({
  product,
  source,
  onInteraction,
}: RecommendationCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isWishlisted, toggle } = useWishlist(product.id);

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Added to cart");
        }
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
        void queryClient.invalidateQueries(trpc.cart.get.queryFilter());
        onInteraction?.(product.id, "cart");
      },
      onError: (err) => {
        const message =
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart";
        if (Platform.OS === "android") {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert("Error", message);
        }
      },
    }),
  );

  const handleCardPress = useCallback(() => {
    onInteraction?.(product.id, "view");
    router.push(`/products/${product.slug}`);
  }, [product.id, product.slug, router, onInteraction]);

  const handleAddToCart = useCallback(() => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  }, [addToCart, product.id]);

  const handleWishlistToggle = useCallback(() => {
    void toggle(product.id);
    onInteraction?.(product.id, isWishlisted ? "remove_wishlist" : "wishlist");
  }, [toggle, product.id, isWishlisted, onInteraction]);

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

  function isImageObject(value: unknown): value is { url: string } {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { url?: unknown }).url === "string"
    );
  }

  const rawFirst = Array.isArray(product.images)
    ? (product.images[0] as unknown)
    : undefined;
  const candidateUrl: string | undefined =
    typeof rawFirst === "string"
      ? rawFirst
      : isImageObject(rawFirst)
        ? rawFirst.url
        : undefined;

  const baseUrl = getBaseUrl();
  const absoluteUrl: string | undefined =
    typeof candidateUrl === "string"
      ? candidateUrl.startsWith("http")
        ? candidateUrl
        : `${baseUrl}${candidateUrl}`
      : undefined;

  const imageUrl = absoluteUrl?.startsWith("https://")
    ? absoluteUrl
    : `https://placehold.co/400x400/fce7f3/ec4899.png?text=${encodeURIComponent(product.name)}`;

  return (
    <Pressable
      onPress={handleCardPress}
      className="w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm active:opacity-80"
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${product.name} - ${source} recommendation`}
      style={{ minHeight: 44 }} // AA touch target
    >
      {/* Image Container */}
      <View className="relative aspect-square w-full bg-gradient-to-br from-pink-50 to-pink-100">
        {/* Badges */}
        <View className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {hasDiscount && (
            <View className="rounded-full bg-red-500 px-2 py-0.5 shadow-sm">
              <Text className="text-xs font-bold text-white">
                -{discountPercentage}%
              </Text>
            </View>
          )}
          {product.isFeatured && (
            <View className="rounded-full bg-pink-500 px-2 py-0.5 shadow-sm">
              <Text className="text-xs font-bold text-white">Featured</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button */}
        <Pressable
          onPress={handleWishlistToggle}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-2 shadow-md active:scale-95"
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          style={{ minHeight: 44, minWidth: 44 }}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={18}
            color={isWishlisted ? "#EC4899" : "#525252"}
          />
        </Pressable>

        {/* Product Image */}
        <ExpoImage
          source={{ uri: imageUrl }}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          allowDownscaling
          recyclingKey={product.id}
          transition={250}
        />
      </View>

      {/* Content Container */}
      <View className="p-3">
        {/* Product Name */}
        <Text
          className="mb-1 text-sm font-semibold text-gray-900"
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View className="mb-2 flex flex-row flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <View
                key={tag}
                className="rounded-full bg-pink-50 px-2 py-0.5"
              >
                <Text className="text-xs font-medium text-pink-700">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pricing */}
        <View className="mb-2 flex flex-row items-center gap-2">
          <Text className="text-base font-bold text-gray-900">
            ${product.price}
          </Text>
          {product.compareAtPrice && (
            <Text className="text-xs text-gray-500 line-through">
              ${product.compareAtPrice}
            </Text>
          )}
        </View>

        {/* Stock Warning */}
        {product.inventory > 0 && product.inventory < 10 && (
          <Text className="mb-2 text-xs font-medium text-orange-600">
            {product.inventory} left
          </Text>
        )}

        {/* Add to Cart Button */}
        <Pressable
          onPress={handleAddToCart}
          disabled={addToCart.isPending || product.inventory === 0}
          className={`rounded-xl py-2.5 ${
            addToCart.isPending || product.inventory === 0
              ? "bg-gray-200"
              : "bg-pink-600"
          } active:scale-95`}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          style={{ minHeight: 44 }}
        >
          <View className="flex flex-row items-center justify-center gap-1.5">
            <Ionicons
              name="cart-outline"
              size={16}
              color={
                addToCart.isPending || product.inventory === 0
                  ? "#6B7280"
                  : "#FFFFFF"
              }
            />
            <Text
              className={`text-xs font-semibold ${
                addToCart.isPending || product.inventory === 0
                  ? "text-gray-700"
                  : "text-white"
              }`}
            >
              {product.inventory === 0
                ? "Out of Stock"
                : addToCart.isPending
                  ? "Adding..."
                  : "Add to Cart"}
            </Text>
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Recommendation Card Skeleton
// ============================================================================

export function RecommendationCardSkeleton() {
  return (
    <View
      className="w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      accessible
      accessibilityRole="none"
      accessibilityLabel="Loading recommendation"
    >
      <View className="aspect-square w-full animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      <View className="p-3">
        <View className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <View className="mb-2 flex flex-row gap-1">
          <View className="h-4 w-10 animate-pulse rounded-full bg-gray-200" />
          <View className="h-4 w-10 animate-pulse rounded-full bg-gray-200" />
        </View>
        <View className="mb-2 h-5 w-16 animate-pulse rounded bg-gray-200" />
        <View className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
      </View>
    </View>
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
  backgroundColor = "bg-white",
}: RecommendationSectionProps) {
  return (
    <View className={`py-6 ${backgroundColor}`}>
      {/* Section Header */}
      <View className="mb-4 px-4">
        <View className="flex flex-row items-center gap-3">
          {icon && (
            <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
              <Ionicons name={icon} size={20} color="#EC4899" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            {subtitle && (
              <Text className="mt-0.5 text-sm text-gray-600">{subtitle}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Section Content */}
      {children}
    </View>
  );
}

// ============================================================================
// For You Section
// ============================================================================

export function ForYouSection() {
  const { data: recommendations, isLoading } = useQuery(
    trpc.recommendation.getForYou.queryOptions({
      limit: 12,
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackInteraction.mutationOptions(),
  );

  const handleInteraction = useCallback(
    (productId: string, type: string) => {
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
    },
    [trackInteraction],
  );

  if (isLoading) {
    return (
      <RecommendationSection
        title="For You"
        subtitle="Personalized picks just for you"
        icon="sparkles"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </ScrollView>
      </RecommendationSection>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <RecommendationSection
        title="For You"
        subtitle="Personalized picks just for you"
        icon="sparkles"
      >
        <View className="mx-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8">
          <View className="items-center">
            <Ionicons name="eye-outline" size={48} color="#A3A3A3" />
            <Text className="mt-4 text-center text-base font-semibold text-gray-700">
              Start exploring to get personalized recommendations
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-500">
              Browse products and we'll learn your style preferences
            </Text>
          </View>
        </View>
      </RecommendationSection>
    );
  }

  return (
    <RecommendationSection
      title="For You"
      subtitle="Personalized picks based on your style"
      icon="sparkles"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        accessible
        accessibilityRole="list"
      >
        {recommendations.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="forYou"
            onInteraction={handleInteraction}
          />
        ))}
      </ScrollView>
    </RecommendationSection>
  );
}

// ============================================================================
// Similar Products Section
// ============================================================================

export function SimilarProductsSection({ productId }: { productId: string }) {
  const { data: similarProducts, isLoading } = useQuery(
    trpc.recommendation.getSimilarProducts.queryOptions({
      productId,
      limit: 8,
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackSessionInteraction.mutationOptions(),
  );

  const handleInteraction = useCallback(
    (productId: string, type: string) => {
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
    },
    [trackInteraction],
  );

  if (isLoading) {
    return (
      <RecommendationSection
        title="Similar Items"
        subtitle="You might also like these"
        icon="heart"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </ScrollView>
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
      icon="heart"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        accessible
        accessibilityRole="list"
      >
        {similarProducts.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="similar"
            onInteraction={handleInteraction}
          />
        ))}
      </ScrollView>
    </RecommendationSection>
  );
}

// ============================================================================
// Trending Section
// ============================================================================

export function TrendingSection() {
  const { data: trendingProducts, isLoading } = useQuery(
    trpc.recommendation.getTrending.queryOptions({
      limit: 12,
      timeWindow: "24h",
    }),
  );

  const trackInteraction = useMutation(
    trpc.recommendation.trackSessionInteraction.mutationOptions(),
  );

  const handleInteraction = useCallback(
    (productId: string, type: string) => {
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
    },
    [trackInteraction],
  );

  if (isLoading) {
    return (
      <RecommendationSection
        title="Trending Now"
        subtitle="What everyone's loving right now"
        icon="trending-up"
        backgroundColor="bg-gradient-to-b from-pink-50/50 to-white"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </ScrollView>
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
      icon="trending-up"
      backgroundColor="bg-gradient-to-b from-pink-50/50 to-white"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        accessible
        accessibilityRole="list"
      >
        {trendingProducts.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            source="trending"
            onInteraction={handleInteraction}
          />
        ))}
      </ScrollView>
    </RecommendationSection>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function getOrCreateSessionId(): string {
  // For mobile, we'll use a simpler approach with timestamp-based session
  // In production, you might want to use AsyncStorage or a proper session manager
  return `mobile-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
