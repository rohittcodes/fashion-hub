import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { useWishlist } from "~/utils/wishlist-store";

interface ProductDetailProps {
  product: RouterOutputs["product"]["byId"];
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggle } = useWishlist(product.id);
  const { data: session } = authClient.useSession();

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart", ToastAndroid.SHORT);
        } else {
          Alert.alert("Added to cart");
        }
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
      },
      onError: (err) => {
        const message =
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart";
        if (Platform.OS === "android") {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert(message);
        }
      },
    }),
  );

  const addReview = useMutation(
    trpc.product.addReview.mutationOptions({
      onSuccess: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Review added", ToastAndroid.SHORT);
        } else {
          Alert.alert("Review added");
        }
        void queryClient.invalidateQueries(trpc.product.byId.queryFilter());
      },
      onError: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Failed to add review", ToastAndroid.SHORT);
        } else {
          Alert.alert("Failed to add review");
        }
      },
    }),
  );

  const handleAddToCart = () => {
    if (quantity > product.inventory) {
      Alert.alert("Error", "Not enough inventory");
      return;
    }

    addToCart.mutate({
      productId: product.id,
      quantity,
    });
  };

  const handleBuyNow = async () => {
    if (!session) {
      router.push("/onboarding");
      return;
    }
    if (product.inventory === 0) return;
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      router.push("/cart");
    } catch {
      // error already alerted in mutation onError
    }
  };

  const handleAddReview = (
    rating: number,
    title?: string,
    comment?: string,
  ) => {
    addReview.mutate({
      productId: product.id,
      rating,
      title,
      comment,
    });
  };

  const images = product.images ?? [];
  const hasDiscount =
    product.compareAtPrice &&
    parseFloat(product.compareAtPrice) > parseFloat(product.price);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 54 }}
    >
      <View className="p-4">
        <View className="mb-6">
          <View className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            <View className="absolute right-4 top-4 z-10">
              <Pressable
                onPress={() => void toggle(product.id)}
                className="rounded-full bg-white/90 p-3 shadow-lg"
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={24}
                  color={isWishlisted ? "#EC4899" : "#6B7280"}
                />
              </Pressable>
            </View>
            <View className="absolute left-4 top-4 z-10">
              <Pressable className="rounded-full bg-white/90 p-3 shadow-lg">
                <Ionicons name="share-outline" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {images.length > 0 ? (
              <ExpoImage
                source={{
                  uri: images[selectedImageIndex]?.startsWith("http")
                    ? images[selectedImageIndex]
                    : `https://picsum.photos/400/400?random=${product.id.slice(-3)}`,
                }}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
                transition={300}
                allowDownscaling
                recyclingKey={`${product.id}-${selectedImageIndex}`}
                onError={(e: unknown) => {
                  console.log("Product detail image error:", e);
                }}
              />
            ) : (
              <ExpoImage
                source={{
                  uri: `https://picsum.photos/400/400?random=${product.id.slice(-3)}`,
                }}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
                transition={300}
                allowDownscaling
                recyclingKey={`${product.id}-fallback`}
                onError={(e: unknown) => {
                  console.log("Product detail fallback image error:", e);
                }}
              />
            )}
          </View>

          {images.length > 1 && (
            <ScrollView
              horizontal
              className="mt-4"
              showsHorizontalScrollIndicator={false}
            >
              {images.map((image, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  className={`mr-3 h-20 w-20 overflow-hidden rounded-xl border-2 ${
                    selectedImageIndex === index
                      ? "border-pink-500"
                      : "border-gray-200"
                  }`}
                >
                  <ExpoImage
                    source={{
                      uri: image.startsWith("http")
                        ? image
                        : `https://picsum.photos/80/80?random=${product.id.slice(-3)}`,
                    }}
                    contentFit="cover"
                    style={{ width: "100%", height: "100%" }}
                    transition={200}
                    allowDownscaling
                    recyclingKey={`${product.id}-thumb-${index}`}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View className="mb-6">
          <Text className="mt-1 text-3xl font-bold text-gray-900">
            {product.name}
          </Text>

          {/* Rating */}
          <View className="mt-2 flex-row items-center">
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Text className="ml-2 text-sm text-gray-600">
              (4.5) • 128 reviews
            </Text>
          </View>

          <View className="mt-4 flex flex-row items-center">
            <Text className="text-3xl font-bold text-gray-900">
              ${product.price}
            </Text>
            {hasDiscount && (
              <>
                <Text className="ml-3 text-xl text-gray-500 line-through">
                  ${product.compareAtPrice}
                </Text>
                <View className="ml-3 rounded-full bg-red-500 px-3 py-1 shadow-sm">
                  <Text className="text-sm font-bold text-white">
                    Save $
                    {(
                      parseFloat(product.compareAtPrice ?? "0") -
                      parseFloat(product.price)
                    ).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View className="mt-6">
            <Text className="text-base leading-6 text-gray-700">
              {product.description}
            </Text>

            <View className="mt-4 flex-row flex-wrap">
              {product.sku && (
                <View className="mb-2 mr-4 rounded-lg bg-gray-100 px-3 py-2">
                  <Text className="text-sm font-medium text-gray-700">
                    SKU: {product.sku}
                  </Text>
                </View>
              )}
              <View className="mb-2 mr-4 rounded-lg bg-gray-100 px-3 py-2">
                <Text className="text-sm font-medium text-gray-700">
                  Weight: {product.weight ? `${product.weight} lbs` : "N/A"}
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-4">
            {product.inventory > 0 ? (
              <View className="flex-row items-center">
                <View className="rounded-full bg-green-100 px-3 py-1">
                  <Text className="text-sm font-semibold text-green-800">
                    {product.inventory > 10
                      ? "✓ In Stock"
                      : `Only ${product.inventory} left!`}
                  </Text>
                </View>
                {product.inventory <= 10 && (
                  <Text className="ml-2 text-xs font-medium text-orange-600">
                    Hurry! Limited stock
                  </Text>
                )}
              </View>
            ) : (
              <View className="rounded-full bg-red-100 px-3 py-1">
                <Text className="text-sm font-semibold text-red-800">
                  Out of Stock
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="mb-6">
          <View className="mb-6 flex flex-row items-center">
            <Text className="mr-4 text-base font-semibold text-gray-700">
              Quantity:
            </Text>
            <View className="flex flex-row items-center rounded-xl border border-gray-200 bg-white">
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-l-xl border-r border-gray-200"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Text className="text-xl font-bold text-gray-600">-</Text>
              </Pressable>
              <TextInput
                value={quantity.toString()}
                onChangeText={(text) => setQuantity(parseInt(text) || 1)}
                keyboardType="numeric"
                className="w-16 px-3 py-3 text-center text-lg font-semibold"
              />
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-r-xl border-l border-gray-200"
                onPress={() =>
                  setQuantity(Math.min(product.inventory, quantity + 1))
                }
                disabled={quantity >= product.inventory}
              >
                <Text className="text-xl font-bold text-gray-600">+</Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row gap-4">
            <Pressable
              className={`flex-1 rounded-2xl py-4 ${
                product.inventory === 0 || addToCart.isPending
                  ? "bg-gray-300"
                  : "bg-gradient-to-r from-pink-600 to-purple-600"
              }`}
              onPress={handleBuyNow}
              disabled={addToCart.isPending || product.inventory === 0}
            >
              <Text
                className={`text-center text-lg font-bold ${
                  product.inventory === 0 || addToCart.isPending
                    ? "text-gray-600"
                    : "text-white"
                }`}
              >
                {addToCart.isPending ? "Processing..." : "Buy Now"}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 rounded-2xl border-2 px-6 py-4 ${
                product.inventory === 0 || addToCart.isPending
                  ? "border-gray-300"
                  : "border-pink-600"
              }`}
              onPress={handleAddToCart}
              disabled={addToCart.isPending || product.inventory === 0}
            >
              <Text
                className={`text-center text-lg font-bold ${
                  product.inventory === 0 || addToCart.isPending
                    ? "text-gray-500"
                    : "text-pink-600"
                }`}
              >
                {product.inventory === 0
                  ? "Out of Stock"
                  : addToCart.isPending
                    ? "Adding..."
                    : "Add to Cart"}
              </Text>
            </Pressable>
          </View>
        </View>
        {product.tags && product.tags.length > 0 && (
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-900">
              Tags
            </Text>
            <View className="flex flex-row flex-wrap">
              {product.tags.map((tag, index) => (
                <View
                  key={index}
                  className="mb-2 mr-2 rounded-full bg-gray-100 px-3 py-1"
                >
                  <Text className="text-sm text-gray-700">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <ProductReviews
          productId={product.id}
          reviews={product.reviews}
          onAddReview={handleAddReview}
        />
      </View>
    </ScrollView>
  );
}

function ProductReviews({
  productId: _productId,
  reviews,
  onAddReview,
}: {
  productId: string;
  reviews: RouterOutputs["product"]["byId"]["reviews"];
  onAddReview: (rating: number, title?: string, comment?: string) => void;
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    onAddReview(rating, title || undefined, comment || undefined);
    setShowReviewForm(false);
    setRating(0);
    setTitle("");
    setComment("");
  };

  return (
    <View className="mb-6">
      <View className="mb-4 flex flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Reviews</Text>
        <Pressable
          className="rounded-md bg-blue-600 px-4 py-2"
          onPress={() => setShowReviewForm(!showReviewForm)}
        >
          <Text className="text-sm font-medium text-white">Write a Review</Text>
        </Pressable>
      </View>
      {showReviewForm && (
        <View className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            Write a Review
          </Text>

          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Rating
              </Text>
              <View className="flex flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    className="mr-1"
                  >
                    <Text
                      className={`text-2xl ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Title (Optional)
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Review title"
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Comment (Optional)
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your thoughts about this product"
                multiline
                numberOfLines={4}
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
              />
            </View>

            <View className="flex flex-row gap-2">
              <Pressable
                className="flex-1 rounded-md bg-blue-600 py-2"
                onPress={handleSubmitReview}
              >
                <Text className="text-center text-sm font-medium text-white">
                  Submit Review
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-md border border-gray-300 bg-white py-2"
                onPress={() => setShowReviewForm(false)}
              >
                <Text className="text-center text-sm font-medium text-gray-700">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <View>
        {reviews.length === 0 ? (
          <Text className="text-gray-500">
            No reviews yet. Be the first to review!
          </Text>
        ) : (
          reviews.map((review) => (
            <View
              key={review.id}
              className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <View className="mb-2 flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <Text className="font-medium text-gray-900">
                    Anonymous User
                  </Text>
                  <View className="ml-2 flex flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        className={`text-sm ${
                          star <= review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                <Text className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {review.title && (
                <Text className="mb-1 text-base font-semibold text-gray-900">
                  {review.title}
                </Text>
              )}

              {review.comment && (
                <Text className="text-gray-700">{review.comment}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
