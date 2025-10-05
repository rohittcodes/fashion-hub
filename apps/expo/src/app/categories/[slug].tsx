import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function CategoryDetailScreen() {
  const router = useRouter();
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
    <SafeAreaView edges={["bottom"]} className="bg-background">
      <Stack.Screen options={{ title: category.name }} />
      <View className="h-full w-full bg-background pb-28">
        <View className="p-4">
          <Text className="mb-2 text-2xl font-bold text-foreground">
            {category.name}
          </Text>
          {category.description && (
            <Text className="text-muted-foreground">
              {category.description}
            </Text>
          )}
        </View>
        
        <View className="flex-1 px-2">
          {products.length > 0 ? (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="m-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <Pressable onPress={() => router.push(`/products/${item.slug}`)}>
                    <View className="aspect-square bg-gray-100">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{ uri: item.images[0] }}
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
                    <Pressable onPress={() => router.push(`/products/${item.slug}`)}>
                      <Text className="mt-1 text-base font-semibold text-gray-900">
                        {item.name}
                      </Text>
                    </Pressable>

                    <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View className="mt-3 flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center">
                        <Text className="text-lg font-bold text-gray-900">
                          ${item.price}
                        </Text>
                        {item.compareAtPrice && (
                          <Text className="ml-2 text-sm text-gray-500 line-through">
                            ${item.compareAtPrice}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}
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
