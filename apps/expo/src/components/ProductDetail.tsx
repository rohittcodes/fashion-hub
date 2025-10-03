import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";

interface ProductDetailProps {
  product: RouterOutputs["product"]["byId"];
}

export function ProductDetail({ product }: ProductDetailProps) {
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addToCart = useMutation(
    trpc.cart.add.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Added to cart!");
        void queryClient.invalidateQueries(trpc.cart.getCount.queryFilter());
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.data?.code === "UNAUTHORIZED"
            ? "Please sign in to add items to cart"
            : "Failed to add to cart",
        );
      },
    }),
  );

  const addReview = useMutation(
    trpc.product.addReview.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Review added successfully!");
        void queryClient.invalidateQueries(trpc.product.byId.queryFilter());
      },
      onError: () => {
        Alert.alert("Error", "Failed to add review");
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
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Product Images */}
        <View className="mb-6">
          <View className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            {images.length > 0 ? (
              <Image
                source={{ uri: images[selectedImageIndex] }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex h-full w-full items-center justify-center">
                <Text className="text-gray-400">No Image Available</Text>
              </View>
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
                  className={`mr-2 h-20 w-20 overflow-hidden rounded-md border-2 ${
                    selectedImageIndex === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <Image
                    source={{ uri: image }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View className="mb-6">
          <Text className="mt-1 text-2xl font-bold text-gray-900">
            {product.name}
          </Text>

          <View className="mt-3 flex flex-row items-center">
            <Text className="text-2xl font-bold text-gray-900">
              ${product.price}
            </Text>
            {hasDiscount && (
              <>
                <Text className="ml-2 text-lg text-gray-500 line-through">
                  ${product.compareAtPrice}
                </Text>
                <View className="ml-2 rounded bg-red-100 px-2 py-1">
                  <Text className="text-sm font-medium text-red-800">
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

          <View className="mt-4">
            <Text className="text-gray-700">{product.description}</Text>

            {product.sku && (
              <Text className="mt-2 text-sm text-gray-500">
                SKU: {product.sku}
              </Text>
            )}

            <Text className="mt-1 text-sm text-gray-500">
              Weight: {product.weight ? `${product.weight} lbs` : "N/A"}
            </Text>
          </View>

          {/* Inventory Status */}
          <View className="mt-4">
            {product.inventory > 0 ? (
              <Text className="text-sm text-green-600">
                {product.inventory > 10
                  ? "In Stock"
                  : `Only ${product.inventory} left in stock!`}
              </Text>
            ) : (
              <Text className="text-sm text-red-600">Out of Stock</Text>
            )}
          </View>
        </View>

        {/* Add to Cart */}
        <View className="mb-6">
          <View className="mb-4 flex flex-row items-center">
            <Text className="mr-4 text-base font-medium">Quantity:</Text>
            <View className="flex flex-row items-center">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-md border border-gray-300"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Text className="text-lg font-medium text-gray-600">-</Text>
              </Pressable>
              <TextInput
                value={quantity.toString()}
                onChangeText={(text) => setQuantity(parseInt(text) || 1)}
                keyboardType="numeric"
                className="mx-3 w-16 rounded-md border border-gray-300 px-3 py-2 text-center"
              />
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-md border border-gray-300"
                onPress={() =>
                  setQuantity(Math.min(product.inventory, quantity + 1))
                }
                disabled={quantity >= product.inventory}
              >
                <Text className="text-lg font-medium text-gray-600">+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            className={`w-full rounded-md py-4 ${
              product.inventory === 0 || addToCart.isPending
                ? "bg-gray-300"
                : "bg-blue-600"
            }`}
            onPress={handleAddToCart}
            disabled={addToCart.isPending || product.inventory === 0}
          >
            <Text
              className={`text-center text-base font-medium ${
                product.inventory === 0 || addToCart.isPending
                  ? "text-gray-500"
                  : "text-white"
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

        {/* Tags */}
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

      {/* Review Form */}
      {showReviewForm && (
        <View className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            Write a Review
          </Text>

          <View className="space-y-4">
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

            <View className="flex flex-row space-x-2">
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

      {/* Reviews List */}
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
                    {review.user.name}
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
