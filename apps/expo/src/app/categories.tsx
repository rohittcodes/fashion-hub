import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { trpc } from "~/utils/api";

export default function CategoriesScreen() {
  const router = useRouter();
  const categoriesQuery = useQuery(trpc.category.all.queryOptions({}));

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
      <View className="h-full w-full bg-gray-50 pb-28">
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
            renderItem={({ item }) => (
              <Pressable
                className="mb-4 rounded-2xl bg-white p-6 shadow-md border border-gray-200"
                onPress={() => router.push(`/categories/${item.slug}`)}
              >
                <View className="flex flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text className="mt-2 text-sm text-gray-700">
                        {item.description}
                      </Text>
                    )}
                    <View className="mt-3 self-start rounded-full bg-pink-600/10 px-3 py-1">
                      <Text className="text-xs font-semibold text-pink-700">
                        Shop Now →
                      </Text>
                    </View>
                  </View>
                  <View className="ml-4 rounded-full bg-pink-600 p-4">
                    <Ionicons name="storefront-outline" size={24} color="white" />
                  </View>
                </View>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 54 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
