import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { ProductCard, ProductCardSkeleton } from "~/components/ProductCard";
import { trpc } from "~/utils/api";
import { useWishlist } from "~/utils/wishlist-store";

export default function WishlistScreen() {
  const router = useRouter();
  const { ids } = useWishlist();
  const wishlistIds = React.useMemo(() => Array.from(ids), [ids]);

  const productsQuery = useQuery(
    trpc.product.all.queryOptions({
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
  );

  const wishlistedProducts: RouterOutputs["product"]["all"] =
    React.useMemo(() => {
      if (!productsQuery.data || wishlistIds.length === 0)
        return [] as RouterOutputs["product"]["all"];
      const set = new Set(wishlistIds);
      return productsQuery.data.filter((p) => set.has(p.id));
    }, [productsQuery.data, wishlistIds]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Wishlist" }} />

      <View className="h-full w-full bg-gray-50 pb-28">
        <View className="p-6">
          <Text className="mb-2 text-3xl font-bold text-gray-900">
            Wishlist
          </Text>
          <Text className="text-gray-600">
            {wishlistIds.length === 0
              ? "Your wishlist is empty."
              : `${wishlistIds.length} item${wishlistIds.length > 1 ? "s" : ""} saved`}
          </Text>
        </View>

        {wishlistIds.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="mb-3 text-xl font-semibold text-foreground">
              No favorites yet
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              Tap the heart icon on any product to add it to your wishlist.
            </Text>
            <Pressable
              className="rounded-full bg-pink-500 px-6 py-3"
              onPress={() => router.push("/products")}
            >
              <Text className="font-semibold text-white">Browse products</Text>
            </Pressable>
          </View>
        ) : productsQuery.isLoading ? (
          <FlatList
            data={Array.from({ length: 8 })}
            numColumns={2}
            keyExtractor={(_, index) => `skeleton-${index}`}
            renderItem={() => <ProductCardSkeleton />}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 54 }}
            showsVerticalScrollIndicator={false}
          />
        ) : wishlistedProducts.length > 0 ? (
          <FlatList
            data={wishlistedProducts}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ProductCard product={item} />}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 54 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-muted-foreground">
              Saved items are unavailable right now.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
