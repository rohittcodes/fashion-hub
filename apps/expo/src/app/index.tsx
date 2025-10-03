import React from "react";
import { Button, Text, View, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { ProductCard, ProductCardSkeleton } from "~/components/ProductCard";
import type { RouterOutputs } from "~/utils/api";

function MobileAuth() {
  const { data: session } = authClient.useSession();

  return (
    <View className="mb-4">
      <Text className="pb-2 text-center text-xl font-semibold text-zinc-900">
        {session?.user.name ? `Hello, ${session.user.name}` : "Not logged in"}
      </Text>
      <Button
        onPress={() =>
          session
            ? authClient.signOut()
            : authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
              })
        }
        title={session ? "Sign Out" : "Sign In With Discord"}
        color={"#5B65E9"}
      />
    </View>
  );
}

export default function Index() {
  const featuredProductsQuery = useQuery(trpc.product.featured.queryOptions({ limit: 8 }));

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Fashion Hub" }} />
      <View className="h-full w-full bg-background">
        {/* Header */}
        <View className="p-4">
          <Text className="pb-2 text-center text-3xl font-bold text-foreground">
            Fashion <Text className="text-primary">Hub</Text>
          </Text>
          <Text className="pb-4 text-center text-muted-foreground">
            Discover the latest trends in fashion
          </Text>
          <MobileAuth />
        </View>
        <View className="flex-1 px-4">
          <Text className="mb-4 text-xl font-bold text-foreground">
            Featured Products
          </Text>
          
          {featuredProductsQuery.isLoading ? (
            <FlatList
              data={Array.from({ length: 4 })}
              numColumns={2}
              keyExtractor={(_, index) => index.toString()}
              renderItem={() => <ProductCardSkeleton />}
              showsVerticalScrollIndicator={false}
            />
          ) : featuredProductsQuery.data && featuredProductsQuery.data.length > 0 ? (
            <FlatList
              data={featuredProductsQuery.data}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item as RouterOutputs["product"]["all"][number]} />}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">No featured products available</Text>
            </View>
          )}
        </View>
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex flex-row justify-around">
            <Pressable className="items-center">
              <Text className="text-primary">All Products</Text>
            </Pressable>
            <Pressable className="items-center">
              <Text className="text-primary">Cart</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
