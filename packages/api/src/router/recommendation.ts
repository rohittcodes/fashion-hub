import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod/v4";

import {
  cartItems,
  CreateUserInteractionSchema,
  orders,
  products,
  productSimilarities,
  trendingProducts,
  userInteractions,
  userProductScores,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/**
 * AI-Powered Recommendation Engine
 * Hybrid approach: Collaborative Filtering + Content-Based + Trending
 */
export const recommendationRouter = createTRPCRouter({
  /**
   * Track user interaction with a product
   */
  trackInteraction: protectedProcedure
    .input(CreateUserInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Insert interaction
      await ctx.db.insert(userInteractions).values({
        ...input,
        userId,
      });

      // Asynchronously update scores (non-blocking)
      void updateUserProductScore(ctx.db, userId, input.productId);
      void updateTrendingScore(ctx.db, input.productId);

      return { success: true };
    }),

  /**
   * Track anonymous session interaction (for non-logged in users)
   */
  trackSessionInteraction: publicProcedure
    .input(
      CreateUserInteractionSchema.extend({
        sessionId: z.string().min(1),
      }).omit({ userId: true }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(userInteractions).values({
        ...input,
        userId: input.sessionId, // Use sessionId as userId for anonymous tracking
      });

      void updateTrendingScore(ctx.db, input.productId);

      return { success: true };
    }),

  /**
   * Get personalized "For You" recommendations
   * Uses collaborative filtering + content-based hybrid approach
   */
  getForYou: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(12),
        excludeProductIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get user's top scored products
      const scores = await ctx.db
        .select({
          productId: userProductScores.productId,
          finalScore: userProductScores.finalScore,
        })
        .from(userProductScores)
        .where(eq(userProductScores.userId, userId))
        .orderBy(desc(userProductScores.finalScore))
        .limit(input.limit * 2); // Get more to account for filtering

      let productIds = scores.map((s) => s.productId);

      // If user has no history, fall back to trending
      if (productIds.length === 0) {
        const trending = await ctx.db
          .select({ productId: trendingProducts.productId })
          .from(trendingProducts)
          .orderBy(desc(trendingProducts.trendingScore))
          .limit(input.limit);
        productIds = trending.map((t) => t.productId);
      }

      // Exclude specified products
      if (input.excludeProductIds && input.excludeProductIds.length > 0) {
        productIds = productIds.filter(
          (id) => !input.excludeProductIds!.includes(id),
        );
      }

      if (productIds.length === 0) {
        return [];
      }

      // Fetch full product details
      const recommendedProducts = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          images: products.images,
          inventory: products.inventory,
          isFeatured: products.isFeatured,
          tags: products.tags,
        })
        .from(products)
        .where(
          and(
            inArray(products.id, productIds.slice(0, input.limit)),
            eq(products.isActive, true),
            gt(products.inventory, 0),
          ),
        );

      // Maintain score order
      const productMap = new Map(recommendedProducts.map((p) => [p.id, p]));
      return productIds
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .slice(0, input.limit);
    }),

  /**
   * Get similar products based on content similarity
   */
  getSimilarProducts: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().min(1).max(20).default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get similar product IDs
      const similarities = await ctx.db
        .select({
          similarProductId: productSimilarities.similarProductId,
          score: productSimilarities.similarityScore,
        })
        .from(productSimilarities)
        .where(eq(productSimilarities.productId, input.productId))
        .orderBy(desc(productSimilarities.similarityScore))
        .limit(input.limit * 2);

      if (similarities.length === 0) {
        // Fallback: get products from same category
        const product = await ctx.db
          .select({ categoryId: products.categoryId })
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);

        if (product[0]?.categoryId) {
          const categoryProducts = await ctx.db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              description: products.description,
              price: products.price,
              compareAtPrice: products.compareAtPrice,
              images: products.images,
              inventory: products.inventory,
              isFeatured: products.isFeatured,
              tags: products.tags,
            })
            .from(products)
            .where(
              and(
                eq(products.categoryId, product[0].categoryId),
                ne(products.id, input.productId),
                eq(products.isActive, true),
                gt(products.inventory, 0),
              ),
            )
            .limit(input.limit);

          return categoryProducts;
        }

        return [];
      }

      const productIds = similarities.map((s) => s.similarProductId);

      // Fetch full product details
      const similarProducts = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          images: products.images,
          inventory: products.inventory,
          isFeatured: products.isFeatured,
          tags: products.tags,
        })
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.isActive, true),
            gt(products.inventory, 0),
          ),
        );

      // Maintain similarity order
      const productMap = new Map(similarProducts.map((p) => [p.id, p]));
      return productIds
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .slice(0, input.limit);
    }),

  /**
   * Get trending products
   */
  getTrending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(12),
        timeWindow: z.enum(["24h", "7d"]).default("24h"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scoreField =
        input.timeWindow === "24h"
          ? trendingProducts.trendingScore
          : trendingProducts.velocityScore;

      const trending = await ctx.db
        .select({
          productId: trendingProducts.productId,
          score: scoreField,
        })
        .from(trendingProducts)
        .orderBy(desc(scoreField))
        .limit(input.limit * 2);

      if (trending.length === 0) {
        return [];
      }

      const productIds = trending.map((t) => t.productId);

      // Fetch full product details
      const trendingProducts_ = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          images: products.images,
          inventory: products.inventory,
          isFeatured: products.isFeatured,
          tags: products.tags,
        })
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.isActive, true),
            gt(products.inventory, 0),
          ),
        );

      // Maintain trending order
      const productMap = new Map(trendingProducts_.map((p) => [p.id, p]));
      return productIds
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .slice(0, input.limit);
    }),

  /**
   * Compute product similarities (admin/cron job)
   */
  computeSimilarities: protectedProcedure
    .input(
      z.object({
        productId: z.string().optional(),
        batchSize: z.number().min(1).max(100).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get products to process
      const productsToProcess = input.productId
        ? await ctx.db
            .select()
            .from(products)
            .where(eq(products.id, input.productId))
        : await ctx.db
            .select()
            .from(products)
            .where(eq(products.isActive, true))
            .limit(input.batchSize);

      const allProducts = await ctx.db
        .select({
          id: products.id,
          categoryId: products.categoryId,
          price: products.price,
          tags: products.tags,
        })
        .from(products)
        .where(eq(products.isActive, true));

      for (const product of productsToProcess) {
        const similarities = computeContentSimilarity(product, allProducts);

        // Delete old similarities
        await ctx.db
          .delete(productSimilarities)
          .where(eq(productSimilarities.productId, product.id));

        // Insert new similarities
        if (similarities.length > 0) {
          await ctx.db.insert(productSimilarities).values(similarities);
        }
      }

      return {
        success: true,
        processed: productsToProcess.length,
      };
    }),

  /**
   * Batch update trending scores (cron job)
   */
  updateTrendingScores: publicProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all products
    const allProducts = await ctx.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.isActive, true));

    for (const product of allProducts) {
      // Count interactions in time windows
      const interactions24h = await ctx.db
        .select({
          type: userInteractions.interactionType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(userInteractions)
        .where(
          and(
            eq(userInteractions.productId, product.id),
            gt(userInteractions.createdAt, last24h),
          ),
        )
        .groupBy(userInteractions.interactionType);

      const interactions7d = await ctx.db
        .select({
          type: userInteractions.interactionType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(userInteractions)
        .where(
          and(
            eq(userInteractions.productId, product.id),
            gt(userInteractions.createdAt, last7d),
          ),
        )
        .groupBy(userInteractions.interactionType);

      // Aggregate counts
      const counts24h = {
        view: 0,
        cart: 0,
        purchase: 0,
        wishlist: 0,
      };
      const counts7d = {
        view: 0,
        cart: 0,
        purchase: 0,
        wishlist: 0,
      };

      interactions24h.forEach((i) => {
        if (i.type in counts24h) {
          counts24h[i.type as keyof typeof counts24h] = i.count;
        }
      });

      interactions7d.forEach((i) => {
        if (i.type in counts7d) {
          counts7d[i.type as keyof typeof counts7d] = i.count;
        }
      });

      // Calculate trending score (0-100)
      const trendingScore = Math.min(
        100,
        Math.round(
          counts24h.view * 0.5 +
            counts24h.cart * 2 +
            counts24h.purchase * 5 +
            counts24h.wishlist * 1,
        ),
      );

      // Calculate velocity (growth rate)
      const velocityScore = Math.min(
        100,
        Math.round(
          ((counts24h.view - counts7d.view / 7) / Math.max(1, counts7d.view)) *
            100,
        ),
      );

      // Upsert trending product
      await ctx.db
        .insert(trendingProducts)
        .values({
          productId: product.id,
          viewCount24h: counts24h.view,
          cartCount24h: counts24h.cart,
          purchaseCount24h: counts24h.purchase,
          wishlistCount24h: counts24h.wishlist,
          viewCount7d: counts7d.view,
          cartCount7d: counts7d.cart,
          purchaseCount7d: counts7d.purchase,
          wishlistCount7d: counts7d.wishlist,
          trendingScore,
          velocityScore,
        })
        .onConflictDoUpdate({
          target: trendingProducts.productId,
          set: {
            viewCount24h: counts24h.view,
            cartCount24h: counts24h.cart,
            purchaseCount24h: counts24h.purchase,
            wishlistCount24h: counts24h.wishlist,
            viewCount7d: counts7d.view,
            cartCount7d: counts7d.cart,
            purchaseCount7d: counts7d.purchase,
            wishlistCount7d: counts7d.wishlist,
            trendingScore,
            velocityScore,
            updatedAt: new Date(),
          },
        });
    }

    return { success: true, processed: allProducts.length };
  }),
});

/**
 * Helper: Compute content-based similarity between products
 */
function computeContentSimilarity(
  product: {
    id: string;
    categoryId: string | null;
    price: string;
    tags: string[] | null;
  },
  allProducts: {
    id: string;
    categoryId: string | null;
    price: string;
    tags: string[] | null;
  }[],
): Array<{
  productId: string;
  similarProductId: string;
  similarityScore: number;
  similarityFactors: {
    categoryMatch?: boolean;
    priceRange?: boolean;
    tagOverlap?: number;
    styleMatch?: boolean;
  };
}> {
  const similarities: Array<{
    productId: string;
    similarProductId: string;
    similarityScore: number;
    similarityFactors: {
      categoryMatch?: boolean;
      priceRange?: boolean;
      tagOverlap?: number;
      styleMatch?: boolean;
    };
  }> = [];

  const productPrice = parseFloat(product.price);

  for (const other of allProducts) {
    if (other.id === product.id) continue;

    let score = 0;
    const factors: {
      categoryMatch?: boolean;
      priceRange?: boolean;
      tagOverlap?: number;
      styleMatch?: boolean;
    } = {};

    // Category match (40 points)
    if (product.categoryId && other.categoryId === product.categoryId) {
      score += 40;
      factors.categoryMatch = true;
    }

    // Price range (30 points)
    const otherPrice = parseFloat(other.price);
    const priceDiff = Math.abs(productPrice - otherPrice);
    const priceRangePercent = priceDiff / productPrice;
    if (priceRangePercent < 0.3) {
      // Within 30% price range
      score += 30;
      factors.priceRange = true;
    } else if (priceRangePercent < 0.6) {
      score += 15;
    }

    // Tag overlap (30 points)
    if (product.tags && other.tags) {
      const productTags = new Set(product.tags);
      const otherTags = new Set(other.tags);
      const intersection = new Set(
        [...productTags].filter((tag) => otherTags.has(tag)),
      );
      const tagOverlap = intersection.size;
      const tagScore = Math.min(
        30,
        (tagOverlap / Math.max(productTags.size, 1)) * 30,
      );
      score += tagScore;
      factors.tagOverlap = tagOverlap;
    }

    // Only keep products with reasonable similarity
    if (score >= 20) {
      similarities.push({
        productId: product.id,
        similarProductId: other.id,
        similarityScore: Math.round(score),
        similarityFactors: factors,
      });
    }
  }

  // Return top 20 most similar
  return similarities.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 20);
}

/**
 * Helper: Update user product score based on collaborative filtering
 */
async function updateUserProductScore(
  db: any,
  userId: string,
  productId: string,
) {
  // Get user's interaction history
  const userHistory = await db
    .select()
    .from(userInteractions)
    .where(eq(userInteractions.userId, userId))
    .orderBy(desc(userInteractions.createdAt))
    .limit(100);

  // Calculate interaction weights
  const weights = {
    view: 1,
    cart: 3,
    purchase: 10,
    wishlist: 2,
    remove_wishlist: -1,
    remove_cart: -0.5,
  };

  let score = 0;
  let recentBoost = 0;

  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const interaction of userHistory) {
    if (interaction.productId !== productId) continue;

    const weight =
      weights[interaction.interactionType as keyof typeof weights] || 0;
    score += weight;

    // Recency boost (up to 2x for interactions within last day)
    const ageMs = now - interaction.createdAt.getTime();
    const recencyFactor = Math.max(0, 1 - ageMs / (7 * oneDayMs));
    recentBoost += weight * recencyFactor;
  }

  const collaborativeScore = Math.min(100, Math.round(score + recentBoost));

  // Get content-based score from similarities
  const similarities = await db
    .select({ score: productSimilarities.similarityScore })
    .from(productSimilarities)
    .where(eq(productSimilarities.similarProductId, productId))
    .limit(1);

  const contentScore = similarities[0]?.score ?? 0;

  // Get trending score
  const trending = await db
    .select({ score: trendingProducts.trendingScore })
    .from(trendingProducts)
    .where(eq(trendingProducts.productId, productId))
    .limit(1);

  const trendingScore = trending[0]?.score ?? 0;

  // Weighted hybrid score: 50% collaborative, 30% content, 20% trending
  const finalScore = Math.round(
    collaborativeScore * 0.5 + contentScore * 0.3 + trendingScore * 0.2,
  );

  // Upsert user product score
  await db
    .insert(userProductScores)
    .values({
      userId,
      productId,
      collaborativeScore,
      contentScore,
      trendingScore,
      finalScore,
      scoreComponents: {
        viewWeight: weights.view,
        cartWeight: weights.cart,
        purchaseWeight: weights.purchase,
        wishlistWeight: weights.wishlist,
        recency: recentBoost,
      },
    })
    .onConflictDoUpdate({
      target: [userProductScores.userId, userProductScores.productId],
      set: {
        collaborativeScore,
        contentScore,
        trendingScore,
        finalScore,
        updatedAt: new Date(),
      },
    });
}

/**
 * Helper: Update trending score for a product
 */
async function updateTrendingScore(db: any, productId: string) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count recent interactions
  const interactions = await db
    .select({
      type: userInteractions.interactionType,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(userInteractions)
    .where(
      and(
        eq(userInteractions.productId, productId),
        gt(userInteractions.createdAt, last24h),
      ),
    )
    .groupBy(userInteractions.interactionType);

  const counts = {
    view: 0,
    cart: 0,
    purchase: 0,
    wishlist: 0,
  };

  interactions.forEach((i) => {
    if (i.type in counts) {
      counts[i.type as keyof typeof counts] = i.count;
    }
  });

  const trendingScore = Math.min(
    100,
    Math.round(
      counts.view * 0.5 + counts.cart * 2 + counts.purchase * 5 + counts.wishlist * 1,
    ),
  );

  // Update trending product
  await db
    .insert(trendingProducts)
    .values({
      productId,
      viewCount24h: counts.view,
      cartCount24h: counts.cart,
      purchaseCount24h: counts.purchase,
      wishlistCount24h: counts.wishlist,
      trendingScore,
    })
    .onConflictDoUpdate({
      target: trendingProducts.productId,
      set: {
        viewCount24h: counts.view,
        cartCount24h: counts.cart,
        purchaseCount24h: counts.purchase,
        wishlistCount24h: counts.wishlist,
        trendingScore,
        updatedAt: new Date(),
      },
    });
}
