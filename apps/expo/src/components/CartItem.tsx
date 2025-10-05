import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

interface CartItemProps {
  item: RouterOutputs["cart"]["get"]["items"][number];
}

export function CartItem({ item }: CartItemProps) {
  console.log("[CartItem] render", {
    id: item.id,
    pid: item.product.id,
    qty: item.quantity,
    name: item.product.name,
  });
  const queryClient = useQueryClient();

  const updateQuantity = useMutation(
    trpc.cart.updateQuantity.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.cart.get.queryFilter());
      },
      onError: () => {
        Alert.alert("Error", "Failed to update quantity");
      },
    }),
  );

  const removeItem = useMutation(
    trpc.cart.remove.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Item removed from cart");
        void queryClient.invalidateQueries(trpc.cart.get.queryFilter());
      },
      onError: () => {
        Alert.alert("Error", "Failed to remove item");
      },
    }),
  );

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (item.product.inventory && newQuantity > item.product.inventory) {
      Alert.alert("Error", "Not enough inventory");
      return;
    }
    updateQuantity.mutate({
      cartItemId: item.id,
      quantity: newQuantity,
    });
  };

  const handleRemove = () => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => removeItem.mutate(item.id) },
      ],
    );
  };

  const safeId = (item.product.id ?? "0").slice(-3);

  return (
    <View className="mb-4 flex flex-row items-center rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
      <Pressable>
        <View className="h-24 w-24 overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          {item.product.images && item.product.images.length > 0 ? (
            <ExpoImage
              source={{
                uri: item.product.images[0]?.startsWith("http")
                  ? item.product.images[0]
                  : `https://picsum.photos/96/96?random=${safeId}`,
              }}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
              recyclingKey={`cart-${item.id}`}
              allowDownscaling
            />
          ) : (
            <ExpoImage
              source={{
                uri: `https://picsum.photos/96/96?random=${safeId}`,
              }}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
              recyclingKey={`cart-${item.id}-fallback`}
              allowDownscaling
            />
          )}
        </View>
      </Pressable>

      <View className="flex-1 px-4">
        <Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
            {item.product.name}
          </Text>
        </Pressable>
        <Text className="text-sm text-gray-500 font-medium">
          {item.product.category.name}
        </Text>
        <Text className="text-sm text-gray-500">
          ${item.product.price} each
        </Text>
      </View>

      <View className="items-center">
        <View className="mb-3 flex flex-row items-center rounded-xl border border-gray-200 bg-white">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-l-xl border-r border-gray-200"
            onPress={() => handleQuantityChange(item.quantity - 1)}
            disabled={updateQuantity.isPending || item.quantity <= 1}
          >
            <Text className="text-lg font-bold text-gray-600">-</Text>
          </Pressable>
          <Text className="mx-3 w-8 text-center text-base font-semibold">
            {item.quantity}
          </Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-r-xl border-l border-gray-200"
            onPress={() => handleQuantityChange(item.quantity + 1)}
            disabled={
              updateQuantity.isPending ||
              (item.product.inventory ? item.quantity >= item.product.inventory : false)
            }
          >
            <Text className="text-lg font-bold text-gray-600">+</Text>
          </Pressable>
        </View>

        <Text className="text-lg font-bold text-gray-900">
          ${(parseFloat(item.product.price ?? "0") * item.quantity).toFixed(2)}
        </Text>

        <Pressable
          className="mt-2 rounded-lg bg-red-50 px-3 py-1"
          onPress={handleRemove}
          disabled={removeItem.isPending}
        >
          <Text className="text-sm font-semibold text-red-600">Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CartSummary({
  totals,
}: {
  totals: RouterOutputs["cart"]["get"]["totals"];
}) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const subtotal = parseFloat(totals.subtotal);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return (
    <View className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <Text className="mb-6 text-2xl font-bold text-gray-900">Order Summary</Text>

      <View className="space-y-3">
        <View className="flex flex-row justify-between">
          <Text className="text-gray-600 font-medium">Subtotal ({totals.itemCount} items)</Text>
          <Text className="text-gray-900 font-semibold">${subtotal.toFixed(2)}</Text>
        </View>

        <View className="flex flex-row justify-between">
          <Text className="text-gray-600 font-medium">Tax</Text>
          <Text className="text-gray-900 font-semibold">${tax.toFixed(2)}</Text>
        </View>

        <View className="flex flex-row justify-between">
          <Text className="text-gray-600 font-medium">Shipping</Text>
          <Text className="text-gray-900 font-semibold">
            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
          </Text>
        </View>

        {subtotal < 50 && (
          <View className="rounded-lg bg-orange-50 p-3">
            <View className="flex-row items-center justify-center">
              <Ionicons name="car-outline" size={16} color="#EA580C" />
              <Text className="text-sm text-orange-700 font-medium text-center ml-1">
                Add ${(50 - subtotal).toFixed(2)} more for free shipping!
              </Text>
            </View>
          </View>
        )}

        <View className="border-t border-gray-200 pt-4">
          <View className="flex flex-row justify-between">
            <Text className="text-xl font-bold text-gray-900">Total</Text>
            <Text className="text-xl font-bold text-gray-900">${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Pressable
        className="mt-6 w-full rounded-2xl bg-pink-600 py-4 shadow-lg"
        onPress={() => {
          if (!session) {
            router.push("/onboarding");
            return;
          }
          router.push("/checkout");
        }}
      >
        <Text className="text-center text-lg font-bold text-white">Proceed to Checkout</Text>
      </Pressable>
    </View>
  );
}
