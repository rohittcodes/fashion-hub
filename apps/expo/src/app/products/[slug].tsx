import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProductDetail } from "~/components/ProductDetail";
import { trpc } from "~/utils/api";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const productQuery = useQuery(
    trpc.product.bySlug.queryOptions({ slug: slug || "" }),
  );

  const productDetailQuery = useQuery(
    trpc.product.byId.queryOptions({ id: productQuery.data?.id ?? "" }),
  );

  if (productQuery.isLoading) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Loading..." }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productQuery.error || productDetailQuery.error) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!productDetailQuery.data) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Not Found" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: productDetailQuery.data.name }} />
      <ProductDetail product={productDetailQuery.data} />
    </SafeAreaView>
  );
}
