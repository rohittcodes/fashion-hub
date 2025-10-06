import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "~/components/ProductCard";
import { trpc } from "~/utils/api";

export default function CategoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const categoryQuery = useQuery(
    trpc.category.bySlug.queryOptions({ slug: slug || "" }),
  );

  const productsQuery = useQuery(
    trpc.category.withProducts.queryOptions({
      slug: slug || "",
      limit: 20,
    }),
  );

  if (categoryQuery.isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
        <Stack.Screen options={{ title: "Loading..." }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading category...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productsQuery.error || !productsQuery.data) {
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { category, products } = productsQuery.data;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: category.name }} />
      <View className="flex-1 bg-background pb-28">
        <View className="p-4">
          <Text className="mb-2 text-2xl font-bold text-gray-900">
            {category.name}
          </Text>
          {category.description && (
            <Text className="text-gray-600">{category.description}</Text>
          )}
        </View>

        <View className="flex-1 px-2">
          {products.length > 0 ? (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item as never} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 54 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">
                No products found in this category
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
