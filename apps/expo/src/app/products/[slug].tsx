import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProductDetail } from "~/components/ProductDetail";
import { trpc } from "~/utils/api";

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const rawSlug: string | string[] | undefined = params.slug;
  const resolvedSlug = typeof rawSlug === "string" ? rawSlug : Array.isArray(rawSlug) ? (rawSlug[0] ?? "") : "";

  const productQuery = useQuery({
    ...trpc.product.bySlug.queryOptions({ slug: resolvedSlug }),
    enabled: resolvedSlug.length > 0,
  });

  const productId = productQuery.data ? productQuery.data.id : "";
  const productDetailQuery = useQuery({
    ...trpc.product.byId.queryOptions({ id: productId }),
    enabled: productId.length > 0,
  });

  if (productQuery.isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Loading..." }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productQuery.error || productDetailQuery.error) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!productDetailQuery.data && productQuery.data) {
    const basic = productQuery.data;
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <Stack.Screen options={{ title: basic.name }} />
        <View className="flex-1 p-4">
          <Text className="mb-2 text-2xl font-bold text-foreground">
            {basic.name}
          </Text>
          {basic.description ? (
            <Text className="text-muted-foreground">
              {basic.description}
            </Text>
          ) : null}
          <View className="mt-6 items-center justify-center">
            <Text className="text-sm text-muted-foreground">Loading details…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: productDetailQuery.data ? productDetailQuery.data.name : productQuery.data ? productQuery.data.name : "Product" }} />
      {productDetailQuery.data ? <ProductDetail product={productDetailQuery.data} /> : null}
    </SafeAreaView>
  );
}
