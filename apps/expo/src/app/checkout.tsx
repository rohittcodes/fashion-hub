import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function CheckoutScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [shipping, setShipping] = React.useState("");
  const [billing, setBilling] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!session) {
      router.replace("/onboarding");
    }
  }, [session, router]);

  const createOrder = useMutation(
    trpc.order.createFromCart.mutationOptions({
      onSuccess: (order) => {
        console.log("[Checkout] order success:", order);
        Alert.alert("Order Placed", `Order #${order.orderNumber}`);
        router.replace("/");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Please try again";
        console.log("[Checkout] order error:", err);
        Alert.alert("Checkout Failed", message);
      },
    }),
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Checkout" }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 8 }}
      >
        <View className="p-4">
          <Text className="mb-4 text-2xl font-bold text-foreground">
            Shipping & Billing
          </Text>

          <View className="mb-4">
            <Text className="mb-2 font-semibold text-foreground">
              Shipping Address
            </Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
              placeholder="123 Main St, City, Country"
              value={shipping}
              onChangeText={setShipping}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 font-semibold text-foreground">
              Billing Address
            </Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
              placeholder="Same as shipping or enter different address"
              value={billing}
              onChangeText={setBilling}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 font-semibold text-foreground">
              Notes (optional)
            </Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
              placeholder="Delivery instructions, etc."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable
            className={`mt-6 w-full rounded-2xl py-4 ${createOrder.isPending ? "bg-gray-300" : "bg-pink-600"}`}
            disabled={createOrder.isPending || !shipping || !billing}
            onPress={() => {
              const payload = {
                shippingAddress: shipping.trim(),
                billingAddress: billing.trim(),
                notes: notes.trim(),
              };
              console.log("[Checkout] createFromCart payload:", payload);
              createOrder.mutate(payload);
            }}
          >
            <Text
              className={`text-center text-lg font-bold ${createOrder.isPending ? "text-gray-500" : "text-white"}`}
            >
              {createOrder.isPending ? "Placing Order..." : "Place Order"}
            </Text>
          </Pressable>
          <View className="h-24" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
