import React, { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProductCard, ProductCardSkeleton } from "~/components/ProductCard";
import { trpc } from "~/utils/api";

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("name");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const productsQuery = useQuery(
    trpc.product.all.queryOptions({
      limit: 20,
      search: debouncedSearch || undefined,
      sortBy,
    }),
  );

  return (
    <SafeAreaView edges={["bottom"]} className="bg-background">
      <Stack.Screen options={{ title: "All Products" }} />
      <View className="h-full w-full bg-gray-50 pb-28">
        <View className="p-6">
          <Text className="mb-2 text-3xl font-bold text-gray-900">
            All Products
          </Text>
          <Text className="mb-6 text-gray-600">
            Discover our complete collection
          </Text>
        </View>
        <View className="px-4">
          <TextInput
            className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-lg shadow-sm"
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
          <View className="mb-4 flex flex-row gap-4">
            <Pressable
              className={`rounded-xl px-4 py-3 ${
                sortBy === "name" ? "bg-pink-500" : "bg-white"
              }`}
              onPress={() => setSortBy("name")}
            >
              <Text
                className={`text-sm font-semibold ${
                  sortBy === "name" ? "text-white" : "text-gray-700"
                }`}
              >
                Name
              </Text>
            </Pressable>
            <Pressable
              className={`rounded-xl px-4 py-3 ${
                sortBy === "price" ? "bg-pink-500" : "bg-white"
              }`}
              onPress={() => setSortBy("price")}
            >
              <Text
                className={`text-sm font-semibold ${
                  sortBy === "price" ? "text-white" : "text-gray-700"
                }`}
              >
                Price
              </Text>
            </Pressable>
            <Pressable
              className={`rounded-xl px-4 py-3 ${
                sortBy === "createdAt" ? "bg-pink-500" : "bg-white"
              }`}
              onPress={() => setSortBy("createdAt")}
            >
              <Text
                className={`text-sm font-semibold ${
                  sortBy === "createdAt" ? "text-white" : "text-gray-700"
                }`}
              >
                Newest
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Products List */}
        <View className="flex-1 px-2">
          {productsQuery.isLoading ? (
            <FlatList
              data={Array.from({ length: 8 })}
              numColumns={2}
              keyExtractor={(_, index) => index.toString()}
              renderItem={() => <ProductCardSkeleton />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 54 }}
            />
          ) : productsQuery.data && productsQuery.data.length > 0 ? (
            <FlatList
              data={productsQuery.data}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 54 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">No products found</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
