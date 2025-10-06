import React from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { authClient } from "~/utils/auth";

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  React.useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Welcome" }} />
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
        }}
        resizeMode="cover"
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View className="bg-black/40 p-6">
          <Text className="mb-2 text-4xl font-extrabold text-white">
            Fashion Hub
          </Text>
          <Text className="mb-6 text-white/90">
            Discover curated styles, exclusive drops, and everyday essentials.
          </Text>

          <View className="gap-4">
            <Pressable
              className="flex-row items-center justify-center rounded-xl bg-white py-4"
              onPress={() =>
                authClient.signIn.social({
                  provider: "discord",
                  callbackURL: "/",
                })
              }
            >
              <Ionicons name="logo-discord" size={20} color="#5865F2" />
              <Text className="ml-2 text-base font-semibold text-gray-900">
                Continue with Discord
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center rounded-xl bg-pink-500 py-4"
              onPress={() => router.replace("/")}
            >
              <Ionicons name="storefront-outline" size={20} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">
                Browse as Guest
              </Text>
            </Pressable>
          </View>

          <Text className="mt-6 text-center text-xs text-white/80">
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
