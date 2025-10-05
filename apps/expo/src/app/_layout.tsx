import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { queryClient } from "~/utils/api";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f472b6",
          },
          contentStyle: {
            backgroundColor: colorScheme == "dark" ? "#09090B" : "#FFFFFF",
          },
        }}
      />
      {pathname !== "/onboarding" && (
        <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0">
          <View className="border-t border-gray-200 bg-white p-4">
            <View className="flex flex-row justify-around">
              <Pressable className="items-center" onPress={() => router.push("/")}>
                <Ionicons name="home-outline" size={24} color="#EC4899" />
                <Text className="text-primary text-xs font-medium mt-1">Home</Text>
              </Pressable>
              <Pressable className="items-center" onPress={() => router.push("/products")}>
                <Ionicons name="storefront-outline" size={24} color="#EC4899" />
                <Text className="text-primary text-xs font-medium mt-1">Products</Text>
              </Pressable>
              <Pressable className="items-center" onPress={() => router.push("/categories")}>
                <Ionicons name="grid-outline" size={24} color="#EC4899" />
                <Text className="text-primary text-xs font-medium mt-1">Categories</Text>
              </Pressable>
              <Pressable className="items-center" onPress={() => router.push("/cart")}>
                <Ionicons name="cart-outline" size={24} color="#EC4899" />
                <Text className="text-primary text-xs font-medium mt-1">Cart</Text>
              </Pressable>
              <Pressable className="items-center" onPress={() => router.push("/profile")}>
                <Ionicons name="person-outline" size={24} color="#EC4899" />
                <Text className="text-primary text-xs font-medium mt-1">Profile</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      )}
      <StatusBar />
    </QueryClientProvider>
  );
}
