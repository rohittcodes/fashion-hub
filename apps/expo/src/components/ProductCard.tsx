import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { getBaseUrl } from "~/utils/base-url";
import { useWishlist } from "~/utils/wishlist-store";

interface ProductCardProps {
  product: RouterOutputs["product"]["all"][number];
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isWishlisted, toggle } = useWishlist(product.id);

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart", ToastAndroid.SHORT);
        } else {
          Alert.alert("Added to cart");
        }
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
        void queryClient.invalidateQueries(trpc.cart.get.queryFilter());
      },
      onError: (err) => {
        const message =
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart";
        if (Platform.OS === "android") {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert(message);
        }
      },
    }),
  );

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
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
    : `https://picsum.photos/300/300?random=${product.id.slice(-3)}`;

  return (
    <View className="m-2 w-[45%] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
      <Pressable onPress={() => router.push(`/products/${product.slug}`)}>
        <View className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
          {hasDiscount && (
            <View className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-1">
              <Text className="text-xs font-bold text-white">
                -{discountPercentage}%
              </Text>
            </View>
          )}
          {product.isFeatured && (
            <View className="absolute left-20 top-2 z-10 rounded-full bg-pink-500 px-2 py-1">
              <Text className="text-xs font-bold text-white">Featured</Text>
            </View>
          )}

          {/* Wishlist Button */}
          <View className="absolute right-2 top-2 z-10">
            <Pressable
              onPress={() => void toggle(product.id)}
              className="rounded-full bg-white/90 p-2 shadow-sm"
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? "#EC4899" : "#6B7280"}
              />
            </Pressable>
          </View>
          <ExpoImage
            source={{ uri: imageUrl }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
            allowDownscaling
            recyclingKey={product.id}
            onError={(e: unknown) =>
              console.log("Image load error:", e, imageUrl)
            }
          />
          <View className="absolute bottom-2 right-2 z-10">
            <Pressable
              disabled={addToCart.isPending || product.inventory === 0}
              onPress={handleAddToCart}
              className={`rounded-full p-3 shadow-md ${
                addToCart.isPending || product.inventory === 0
                  ? "bg-gray-200"
                  : "bg-pink-500"
              }`}
            >
              <Ionicons
                name="cart-outline"
                size={18}
                color={
                  addToCart.isPending || product.inventory === 0
                    ? "#6B7280"
                    : "#FFFFFF"
                }
              />
            </Pressable>
          </View>
        </View>
      </Pressable>

      <View className="p-4">
        {product.category && (
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {product.category.name}
          </Text>
        )}

        <Pressable onPress={() => router.push(`/products/${product.slug}`)}>
          <Text
            className="mt-1 text-base font-bold text-gray-900"
            numberOfLines={2}
          >
            {product.name || "No Name"}
          </Text>
        </Pressable>

        <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
          {product.description ?? "No Description"}
        </Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Ionicons name="star" size={12} color="#FCD34D" />
          <Text className="ml-1 text-xs text-gray-500">(4.5)</Text>
        </View>

        <View className="mt-3 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <Text className="text-lg font-bold text-gray-900">
              ${product.price || "No Price"}
            </Text>
            {product.compareAtPrice && (
              <Text className="ml-2 text-sm text-gray-600 line-through">
                ${product.compareAtPrice}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          className={`mt-3 rounded-xl py-3 ${
            product.inventory === 0 || addToCart.isPending
              ? "bg-gray-200"
              : "bg-pink-600"
          }`}
          onPress={handleAddToCart}
          disabled={addToCart.isPending || product.inventory === 0}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              product.inventory === 0 || addToCart.isPending
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
        </Pressable>

        {product.inventory > 0 && product.inventory < 10 && (
          <View className="mt-2 rounded-lg bg-orange-50 px-2 py-1">
            <Text className="text-center text-xs font-medium text-orange-600">
              Only {product.inventory} left in stock!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View className="m-2 w-[45%] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
      <View className="aspect-square animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      <View className="p-4">
        <View className="mb-2 h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        <View className="mb-1 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        <View className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200" />
        <View className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
        <View className="mb-3 flex flex-row items-center justify-between">
          <View className="h-6 w-16 animate-pulse rounded bg-gray-200" />
        </View>
        <View className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
      </View>
    </View>
  );
}
