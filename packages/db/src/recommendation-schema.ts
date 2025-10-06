import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { products } from "./schema";

/**
 * User Interactions - tracks all user actions for recommendation engine
 */
export const userInteractions = pgTable(
  "user_interactions",
  {
    id: uuid().notNull().primaryKey().defaultRandom(),
    userId: text().notNull(), // References user.id from auth schema
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    interactionType: text().notNull(), // 'view', 'cart', 'purchase', 'wishlist', 'remove_wishlist', 'remove_cart'
    sessionId: text(), // For anonymous/session-based tracking
    metadata: jsonb().$type<{
      duration?: number; // view duration in seconds
      quantity?: number; // for cart/purchase
      source?: string; // where interaction originated
      price?: string; // price at time of interaction
    }>(),
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("user_interactions_user_id_idx").on(table.userId),
    index("user_interactions_product_id_idx").on(table.productId),
    index("user_interactions_type_idx").on(table.interactionType),
    index("user_interactions_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Product Similarities - precomputed content-based similarities
 */
export const productSimilarities = pgTable(
  "product_similarities",
  {
    id: uuid().notNull().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    similarProductId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    similarityScore: integer().notNull(), // 0-100, normalized similarity score
    similarityFactors: jsonb().$type<{
      categoryMatch?: boolean;
      priceRange?: boolean;
      tagOverlap?: number;
      styleMatch?: boolean;
    }>(),
    updatedAt: timestamp({ mode: "date", withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("product_similarities_product_id_idx").on(table.productId),
    index("product_similarities_score_idx").on(table.similarityScore),
  ],
);

/**
 * User Product Scores - hybrid recommendation scores (collaborative + content)
 */
export const userProductScores = pgTable(
  "user_product_scores",
  {
    id: uuid().notNull().primaryKey().defaultRandom(),
    userId: text().notNull(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collaborativeScore: integer().notNull().default(0), // 0-100
    contentScore: integer().notNull().default(0), // 0-100
    trendingScore: integer().notNull().default(0), // 0-100
    finalScore: integer().notNull().default(0), // weighted hybrid score 0-100
    scoreComponents: jsonb().$type<{
      viewWeight?: number;
      cartWeight?: number;
      purchaseWeight?: number;
      wishlistWeight?: number;
      recency?: number;
      popularity?: number;
    }>(),
    updatedAt: timestamp({ mode: "date", withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("user_product_scores_user_id_idx").on(table.userId),
    index("user_product_scores_product_id_idx").on(table.productId),
    index("user_product_scores_final_score_idx").on(table.finalScore),
  ],
);

/**
 * Trending Products - tracks product popularity over time windows
 */
export const trendingProducts = pgTable(
  "trending_products",
  {
    id: uuid().notNull().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" })
      .unique(),
    viewCount24h: integer().notNull().default(0),
    cartCount24h: integer().notNull().default(0),
    purchaseCount24h: integer().notNull().default(0),
    wishlistCount24h: integer().notNull().default(0),
    viewCount7d: integer().notNull().default(0),
    cartCount7d: integer().notNull().default(0),
    purchaseCount7d: integer().notNull().default(0),
    wishlistCount7d: integer().notNull().default(0),
    trendingScore: integer().notNull().default(0), // 0-100
    velocityScore: integer().notNull().default(0), // rate of change score 0-100
    updatedAt: timestamp({ mode: "date", withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("trending_products_product_id_idx").on(table.productId),
    index("trending_products_trending_score_idx").on(table.trendingScore),
    index("trending_products_velocity_score_idx").on(table.velocityScore),
  ],
);

// Zod Schemas for validation
export const CreateUserInteractionSchema = createInsertSchema(
  userInteractions,
  {
    interactionType: z.enum([
      "view",
      "cart",
      "purchase",
      "wishlist",
      "remove_wishlist",
      "remove_cart",
    ]),
    metadata: z
      .object({
        duration: z.number().optional(),
        quantity: z.number().int().positive().optional(),
        source: z.string().optional(),
        price: z.string().optional(),
      })
      .optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const CreateProductSimilaritySchema = createInsertSchema(
  productSimilarities,
  {
    similarityScore: z.number().int().min(0).max(100),
    similarityFactors: z
      .object({
        categoryMatch: z.boolean().optional(),
        priceRange: z.boolean().optional(),
        tagOverlap: z.number().optional(),
        styleMatch: z.boolean().optional(),
      })
      .optional(),
  },
).omit({
  id: true,
  updatedAt: true,
});

// Type exports
export type UserInteraction = typeof userInteractions.$inferSelect;
export type CreateUserInteraction = z.infer<
  typeof CreateUserInteractionSchema
>;

export type ProductSimilarity = typeof productSimilarities.$inferSelect;
export type CreateProductSimilarity = z.infer<
  typeof CreateProductSimilaritySchema
>;

export type UserProductScore = typeof userProductScores.$inferSelect;
export type TrendingProduct = typeof trendingProducts.$inferSelect;
