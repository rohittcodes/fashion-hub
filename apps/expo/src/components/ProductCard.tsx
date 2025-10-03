import React from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";

interface ProductCardProps {
  product: RouterOutputs["product"]["all"][number];
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Added to cart!");
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart"
        );
      },
    })
  );

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };

  return (
    <View className="m-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <Pressable>
        <View className="aspect-square bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex h-full w-full items-center justify-center">
              <Text className="text-gray-400">No Image</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View className="p-4">
        {product.category && (
          <Text className="text-xs text-gray-500">{product.category.name}</Text>
        )}

        <Pressable>
          <Text className="mt-1 text-base font-semibold text-gray-900">
            {product.name}
          </Text>
        </Pressable>

        <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
          {product.description}
        </Text>

        <View className="mt-3 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <Text className="text-lg font-bold text-gray-900">
              ${product.price}
            </Text>
            {product.compareAtPrice && (
              <Text className="ml-2 text-sm text-gray-500 line-through">
                ${product.compareAtPrice}
              </Text>
            )}
          </View>

          <Pressable
            className={`rounded-md px-3 py-2 ${
              product.inventory === 0 || addToCart.isPending
                ? "bg-gray-300"
                : "bg-blue-600"
            }`}
            onPress={handleAddToCart}
            disabled={addToCart.isPending || product.inventory === 0}
          >
            <Text
              className={`text-sm font-medium ${
                product.inventory === 0 || addToCart.isPending
                  ? "text-gray-500"
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
        </View>

        {product.inventory > 0 && product.inventory < 10 && (
          <Text className="mt-2 text-xs text-orange-600">
            Only {product.inventory} left in stock!
          </Text>
        )}
      </View>
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View className="m-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <View className="aspect-square animate-pulse bg-gray-200" />
      <View className="p-4">
        <View className="mb-2 h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        <View className="mb-1 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        <View className="mb-3 h-4 w-full animate-pulse rounded bg-gray-200" />
        <View className="flex flex-row items-center justify-between">
          <View className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          <View className="h-8 w-20 animate-pulse rounded bg-gray-200" />
        </View>
      </View>
    </View>
  );
}
