import { z } from "zod/v4";

import { eq, inArray } from "@acme/db";
import { categories, products, userInteractions } from "@acme/db/schema";

import { RecommendationService } from "../recommendation/service";
import { publicProcedure, protectedProcedure } from "../trpc";

const interactionWeights: Record<"view" | "cart" | "purchase" | "wishlist", string> = {
  view: "0.30",
  cart: "0.70",
  purchase: "1.40",
  wishlist: "0.90",
};

export interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  images: string[] | null;
  tags: string[] | null;
  category: { id: string; name: string; slug: string } | null;
};

const productSelection = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  images: products.images,
  tags: products.tags,
  category: {
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
  },
};

const mapById = (rows: RecommendationProduct[]) => {
  const map = new Map<string, RecommendationProduct>();
  for (const product of rows) {
    map.set(product.id, product);
  }
  return map;
};

const projectResult = (
  results: { score: number; productId: string }[],
  productsMap: Map<string, RecommendationProduct>,
) =>
  results
    .map((result) => ({
      score: result.score,
      product: productsMap.get(result.productId),
    }))
    .filter((item): item is { score: number; product: RecommendationProduct } =>
      Boolean(item.product),
    );

export const recommendationRouter = {
  forYou: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(24).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new RecommendationService(ctx.db);
      const userId = ctx.session?.user.id;
      const results = await service.recommendForUser({
        userId,
        limit: input.limit,
      });

      if (results.length === 0) return [];

      const productIds = results.map((r) => r.productId);
      const rows = (await ctx.db
        .select(productSelection)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(products.id, productIds))) as RecommendationProduct[];

      const productsMap = mapById(rows);
      return projectResult(results, productsMap);
    }),

  similar: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().min(1).max(16).default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new RecommendationService(ctx.db);
      const results = await service.similarToProduct({
        productId: input.productId,
        limit: input.limit,
        userId: ctx.session?.user.id,
      });

      if (results.length === 0) return [];

      const productIds = results.map((r) => r.productId);
      const rows = (await ctx.db
        .select(productSelection)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(products.id, productIds))) as RecommendationProduct[];

      const productsMap = mapById(rows);
      return projectResult(results, productsMap);
    }),

  trending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(24).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new RecommendationService(ctx.db);
      const results = await service.trending(input.limit);

      if (results.length === 0) return [];

      const productIds = results.map((r) => r.productId);
      const rows = (await ctx.db
        .select(productSelection)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(products.id, productIds))) as RecommendationProduct[];

      const productsMap = mapById(rows);
      return projectResult(results, productsMap);
    }),

  trackInteraction: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        interactionType: z.enum(["view", "cart", "purchase", "wishlist"]),
        weight: z.number().positive().max(5).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db.insert(userInteractions).values({
        userId,
        productId: input.productId,
        interactionType: input.interactionType,
        weight: input.weight?.toFixed(2) ?? interactionWeights[input.interactionType],
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      return { success: true };
    }),
};




