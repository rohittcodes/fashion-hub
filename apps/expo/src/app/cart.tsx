import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { CartItem, CartSummary } from "~/components/CartItem";
import { trpc } from "~/utils/api";

export default function CartScreen() {
  const cartQuery = useQuery(trpc.cart.get.queryOptions());

  if (cartQuery.isLoading) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartQuery.error) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Failed to load cart</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cart = cartQuery.data;

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mb-4 text-center text-2xl font-bold text-foreground">
            Your cart is empty
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Add some products to get started!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Shopping Cart" }} />
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          {/* Cart Items */}
          <View className="mb-6">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </View>

          {/* Cart Summary */}
          <CartSummary totals={cart.totals} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
