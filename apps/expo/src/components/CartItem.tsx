import React from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";

interface CartItemProps {
  item: RouterOutputs["cart"]["get"]["items"][number];
}

export function CartItem({ item }: CartItemProps) {
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

  return (
    <View className="mb-4 flex flex-row items-center rounded-lg border border-gray-200 bg-white p-4">
      <Pressable>
        <View className="h-20 w-20 overflow-hidden rounded-md bg-gray-100">
          {item.product.images && item.product.images.length > 0 ? (
            <Image
              source={{ uri: item.product.images[0] }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex h-full w-full items-center justify-center">
              <Text className="text-xs text-gray-400">No Image</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View className="flex-1 px-4">
        <Pressable>
          <Text className="text-base font-semibold text-gray-900">
            {item.product.name}
          </Text>
        </Pressable>
        <Text className="text-sm text-gray-500">
          {item.product.category.name}
        </Text>
        <Text className="text-sm text-gray-500">
          ${item.product.price} each
        </Text>
      </View>

      <View className="items-center">
        <View className="mb-2 flex flex-row items-center">
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md border border-gray-300"
            onPress={() => handleQuantityChange(item.quantity - 1)}
            disabled={updateQuantity.isPending || item.quantity <= 1}
          >
            <Text className="text-lg font-medium text-gray-600">-</Text>
          </Pressable>
          <Text className="mx-3 w-8 text-center text-base">
            {item.quantity}
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md border border-gray-300"
            onPress={() => handleQuantityChange(item.quantity + 1)}
            disabled={
              updateQuantity.isPending ||
              (item.product.inventory
                ? item.quantity >= item.product.inventory
                : false)
            }
          >
            <Text className="text-lg font-medium text-gray-600">+</Text>
          </Pressable>
        </View>

        <Text className="text-base font-semibold text-gray-900">
          ${(parseFloat(item.product.price ?? "0") * item.quantity).toFixed(2)}
        </Text>

        <Pressable
          className="mt-2"
          onPress={handleRemove}
          disabled={removeItem.isPending}
        >
          <Text className="text-sm text-red-600">Remove</Text>
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
  const subtotal = parseFloat(totals.subtotal);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return (
    <View className="rounded-lg border border-gray-200 bg-white p-6">
      <Text className="mb-4 text-lg font-semibold text-gray-900">
        Order Summary
      </Text>

      <View className="space-y-2">
        <View className="flex flex-row justify-between">
          <Text className="text-gray-600">
            Subtotal ({totals.itemCount} items)
          </Text>
          <Text className="text-gray-900">${subtotal.toFixed(2)}</Text>
        </View>

        <View className="flex flex-row justify-between">
          <Text className="text-gray-600">Tax</Text>
          <Text className="text-gray-900">${tax.toFixed(2)}</Text>
        </View>

        <View className="flex flex-row justify-between">
          <Text className="text-gray-600">Shipping</Text>
          <Text className="text-gray-900">
            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
          </Text>
        </View>

        {subtotal < 50 && (
          <Text className="text-sm text-orange-600">
            Add ${(50 - subtotal).toFixed(2)} more for free shipping!
          </Text>
        )}

        <View className="border-t border-gray-200 pt-2">
          <View className="flex flex-row justify-between">
            <Text className="text-lg font-semibold text-gray-900">Total</Text>
            <Text className="text-lg font-semibold text-gray-900">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <Pressable className="mt-4 w-full rounded-md bg-blue-600 py-3">
        <Text className="text-center text-base font-medium text-white">
          Proceed to Checkout
        </Text>
      </Pressable>
    </View>
  );
}
