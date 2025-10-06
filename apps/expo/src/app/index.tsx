import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import type { RouterOutputs } from "~/utils/api";
import { ProductCard, ProductCardSkeleton } from "~/components/ProductCard";
import { trpc } from "~/utils/api";
import { ForYouSection, TrendingSection } from "~/components/Recommendations";
// Auth is handled via a dedicated onboarding screen now

function HeroSection() {
  return (
    <View className="relative mb-8 overflow-hidden rounded-2xl bg-pink-500 p-8">
      <View className="absolute inset-0 bg-black/10" />
      <View className="relative z-10">
        <Text className="mb-2 text-3xl font-bold text-white">
          Discover Your Style
        </Text>
        <Text className="mb-4 text-lg text-white/90">
          Shop the latest trends in fashion
        </Text>
        <Pressable className="rounded-full bg-white px-6 py-3">
          <Text className="text-center font-semibold text-pink-500">
            Shop Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CategoryGrid() {
  const router = useRouter();
  const categories = [
    { name: "Women", icon: "woman-outline", color: "bg-pink-100" },
    { name: "Men", icon: "man-outline", color: "bg-blue-100" },
    { name: "Accessories", icon: "bag-outline", color: "bg-purple-100" },
    { name: "Shoes", icon: "footsteps-outline", color: "bg-green-100" },
  ];

  return (
    <View className="mb-8">
      <Text className="mb-4 text-xl font-bold text-foreground">Shop by Category</Text>
      <View className="flex-row flex-wrap justify-between">
        {categories.map((category, index) => (
          <Pressable
            key={index}
            className={`mb-4 w-[48%] rounded-xl ${category.color} p-4`}
            onPress={() => router.push("/categories")}
          >
            <View className="mb-2 items-center">
              <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={32} color="#6B7280" />
            </View>
            <Text className="text-center font-semibold text-gray-800">
              {category.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const featuredProductsQuery = useQuery(
    trpc.product.featured.queryOptions({ limit: 8 }),
  );

  console.log("Featured Products:", featuredProductsQuery.data?.length ?? 0, "items");

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Fashion Hub" }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 56 }}>
        <View className="p-4">
          <Text className="pb-2 text-center text-3xl font-bold text-foreground">
            Fashion <Text className="text-primary">Hub</Text>
          </Text>
          <Text className="pb-4 text-center text-muted-foreground">
            Discover the latest trends in fashion
          </Text>
        </View>

        <View className="px-4">
          <HeroSection />
          <CategoryGrid />
          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">
                Featured Products
              </Text>
              <Pressable onPress={() => router.push("/products")}>
                <Text className="text-primary font-medium">View All</Text>
              </Pressable>
            </View>

            {featuredProductsQuery.isLoading ? (
              <View className="flex-row flex-wrap">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </View>
            ) : featuredProductsQuery.data &&
              featuredProductsQuery.data.length > 0 ? (
              <View className="flex-row flex-wrap">
                {featuredProductsQuery.data.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item as RouterOutputs["product"]["all"][number]}
                  />
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-16">
                <Ionicons name="storefront-outline" size={40} color="#E5E7EB" />
                <Text className="mt-3 text-muted-foreground">No featured products available</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Recommendations */}
        <View className="px-4">
          <ForYouSection />
          <TrendingSection />
        </View>
      </ScrollView>
      
    </SafeAreaView>
  );
}
