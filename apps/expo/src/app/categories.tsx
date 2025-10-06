import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function CategoriesScreen() {
  const router = useRouter();
  const categoriesQuery = useQuery(
    trpc.category.all.queryOptions({
      includeInactive: false,
      withProductCount: true,
    }),
  );

  if (categoriesQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Categories" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (categoriesQuery.error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Categories" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Failed to load categories</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categories = categoriesQuery.data;

  if (!categories || categories.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Categories" }} />
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-4 rounded-full bg-pink-600/10 p-4">
            <Ionicons name="list-outline" size={28} color="#DB2777" />
          </View>
          <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
            No categories available
          </Text>
          <Text className="mb-6 text-center text-gray-600">
            Check back later for new categories!
          </Text>
          <Pressable
            className="rounded-2xl bg-pink-600 px-5 py-3"
            onPress={() => router.push("/")}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Browse Featured Products
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Categories" }} />
      <View className="flex-1 bg-gray-50 pb-28">
        <View className="p-6">
          <Text className="mb-2 text-3xl font-bold text-gray-900">
            Shop by Category
          </Text>
          <Text className="mb-6 text-gray-600">
            Discover products in your favorite categories
          </Text>
        </View>

        <View className="flex-1 px-4">
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <Pressable
                className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                style={{ width: "48%" }}
                onPress={() => router.push(`/categories/${item.slug}`)}
              >
                <View className="aspect-square overflow-hidden bg-gray-100">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-pink-100">
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#9D174D"
                      />
                    </View>
                  )}
                </View>
                <View className="p-4">
                  <Text
                    className="font-semibold text-gray-900"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {typeof (item as Record<string, unknown>).productCount ===
                  "number" ? (
                    <View className="mt-2 self-start rounded-full bg-gray-100 px-2 py-1">
                      <Text className="text-xs text-gray-600">
                        {
                          (item as unknown as { productCount: number })
                            .productCount
                        }{" "}
                        products
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 54 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500">No categories found</Text>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
