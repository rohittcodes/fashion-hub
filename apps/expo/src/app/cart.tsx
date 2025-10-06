import React from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { CartItem, CartSummary } from "~/components/CartItem";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function CartScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const cartQuery = useQuery({
    ...trpc.cart.get.queryOptions(),
    enabled: !!session,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Debug logs to diagnose cart not showing
  console.log("[Cart] session:", session ? { userId: session.user.id } : null);
  console.log("[Cart] query state:", {
    enabled: !!session,
    isLoading: cartQuery.isLoading,
    isFetching: cartQuery.isFetching,
    error: cartQuery.error
      ? ((
          cartQuery.error as unknown as {
            message?: string;
            shape?: { message?: string };
          }
        ).message ??
        (cartQuery.error as unknown as { shape?: { message?: string } }).shape
          ?.message ??
        "unknown")
      : null,
  });
  if (cartQuery.data) {
    console.log("[Cart] data:", {
      items: cartQuery.data.items.map((i) => ({
        id: i.id,
        pid: i.product.id,
        qty: i.quantity,
      })),
      totals: cartQuery.data.totals,
    });
  }

  if (!session) {
    console.log("[Cart] No session; redirect to onboarding if user proceeds");
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-3 text-center text-2xl font-bold text-foreground">
            You're not signed in
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Sign in to view your cart.
          </Text>
          <Button
            title="Go to Onboarding"
            color="#EC4899"
            onPress={() => router.push("/onboarding")}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (cartQuery.isLoading) {
    console.log("[Cart] Loading...");
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartQuery.error) {
    console.log("[Cart] Error:", cartQuery.error);
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
        <Stack.Screen options={{ title: "Shopping Cart" }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Failed to load cart</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cart = cartQuery.data;

  if (!cart || cart.items.length === 0) {
    console.log("[Cart] Empty or no items", cart);
    return (
      <SafeAreaView edges={["bottom"]} className="bg-background">
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
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Shopping Cart" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 8 }}
      >
        <View className="p-4">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">
              Your Cart ({cart.items.length} items)
            </Text>
            <Text className="text-muted-foreground">
              Review your items before checkout
            </Text>
          </View>
          <View className="mb-6">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </View>
          <CartSummary totals={cart.totals} />
          <View className="h-24" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
