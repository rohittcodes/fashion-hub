import React from "react";
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { useWishlist } from "~/utils/wishlist-store";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { ids } = useWishlist();
  const wishlistCount = ids.size;

  const ordersQuery = useQuery({
    ...trpc.order.getUserOrders.queryOptions({ limit: 20 }),
    enabled: !!session?.user.id,
  });

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", onPress: () => void authClient.signOut() },
    ]);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 112 }}
      >
        <View className="mb-8">
          <Text className="mb-2 text-2xl font-bold text-gray-900">
            {session?.user.name ?? "Guest User"}
          </Text>
          <Text className="text-gray-600">
            {session?.user.email ?? "Sign in to personalize your experience"}
          </Text>
        </View>

        <View className="gap-4">
          <View className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Text className="mb-2 text-lg font-semibold text-gray-900">
              My Wishlist
            </Text>
            <Text className="mb-3 text-gray-600">
              {wishlistCount} item{wishlistCount === 1 ? "" : "s"} saved
            </Text>
            <Pressable
              className="self-start rounded-md bg-pink-500 px-4 py-2"
              onPress={() => router.push("/wishlist")}
            >
              <Text className="text-sm font-semibold text-white">
                Manage Wishlist
              </Text>
            </Pressable>
          </View>

          <View className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Text className="mb-2 text-lg font-semibold text-gray-900">
              Account Information
            </Text>
            <Text className="text-gray-600">
              Email: {session?.user.email ?? "Not signed in"}
            </Text>
            <Text className="text-gray-600">Role: Guest</Text>
          </View>

          {session && (
            <View className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Text className="mb-4 text-lg font-semibold text-gray-900">
                Order History
              </Text>
              {ordersQuery.isLoading ? (
                <Text className="text-gray-600">Loading orders...</Text>
              ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
                <FlatList
                  data={ordersQuery.data}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item: order }) => (
                    <View className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                      <View className="mb-2 flex-row justify-between">
                        <Text className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Text>
                      </View>
                      <Text className="mb-2 text-sm text-gray-600">
                        Total: ${order.total}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                />
              ) : (
                <Text className="text-gray-600">No orders yet</Text>
              )}
            </View>
          )}

          {session ? (
            <Button title="Sign Out" onPress={handleSignOut} color="#ef4444" />
          ) : (
            <Button
              title="Go to Onboarding"
              onPress={() => router.push("/onboarding")}
              color="#5B65E9"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
