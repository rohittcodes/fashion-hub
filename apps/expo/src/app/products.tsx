import React, { useState } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { ProductCard, ProductCardSkeleton } from "~/components/ProductCard";

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
    })
  );

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "All Products" }} />
      <View className="h-full w-full bg-background">
        {/* Search Bar */}
        <View className="p-4">
          <TextInput
            className="rounded-md border border-gray-300 bg-white px-3 py-2"
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
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
            />
          ) : productsQuery.data && productsQuery.data.length > 0 ? (
            <FlatList
              data={productsQuery.data}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} />}
              showsVerticalScrollIndicator={false}
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
