import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, gte, lte, sql } from "@acme/db";
import {
  categories,
  CreateProductSchema,
  productReviews,
  products,
} from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const productRouter = {
  // Get all products with pagination and filtering
  all: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        isFeatured: z.boolean().optional(),
        sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        limit,
        offset,
        categoryId,
        search,
        minPrice,
        maxPrice,
        isFeatured,
        sortBy,
        sortOrder,
      } = input;

      const conditions = [eq(products.isActive, true)];

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      if (search) {
        conditions.push(
          sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`})`,
        );
      }

      if (minPrice) {
        conditions.push(gte(products.price, minPrice));
      }

      if (maxPrice) {
        conditions.push(lte(products.price, maxPrice));
      }

      if (isFeatured !== undefined) {
        conditions.push(eq(products.isFeatured, isFeatured));
      }

      const orderBy =
        sortOrder === "asc" ? products[sortBy] : desc(products[sortBy]);

      const result = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          slug: products.slug,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          sku: products.sku,
          inventory: products.inventory,
          images: products.images,
          isFeatured: products.isFeatured,
          tags: products.tags,
          createdAt: products.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return result;
    }),

  // Get product by ID with reviews
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.id),
        with: {
          category: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Get reviews for this product
      const reviews = await ctx.db
        .select({
          id: productReviews.id,
          rating: productReviews.rating,
          title: productReviews.title,
          comment: productReviews.comment,
          isVerified: productReviews.isVerified,
          createdAt: productReviews.createdAt,
          user: {
            name: sql<string>`user.name`,
          },
        })
        .from(productReviews)
        .leftJoin(sql`user`, eq(productReviews.userId, sql`user.id`))
        .where(eq(productReviews.productId, input.id))
        .orderBy(desc(productReviews.createdAt));

      return {
        ...product,
        reviews,
      };
    }),

  // Get product by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.slug, input.slug),
        with: {
          category: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),

  // Get featured products
  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(8) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          slug: products.slug,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          images: products.images,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
        .orderBy(desc(products.createdAt))
        .limit(input.limit);
    }),

  // Create product (admin only)
  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin role required");
      }

      const [product] = await ctx.db.insert(products).values(input).returning();

      return product;
    }),

  // Update product (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: CreateProductSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin role required");
      }

      const [product] = await ctx.db
        .update(products)
        .set(input.data)
        .where(eq(products.id, input.id))
        .returning();

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),

  // Delete product (admin only)
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin role required");
      }

      const [product] = await ctx.db
        .delete(products)
        .where(eq(products.id, input))
        .returning();

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),

  // Add product review
  addReview: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        rating: z.number().int().min(1).max(5),
        title: z.string().max(100).optional(),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      // Check if user already reviewed this product
      const existingReview = await ctx.db.query.productReviews.findFirst({
        where: and(
          eq(productReviews.productId, input.productId),
          eq(productReviews.userId, ctx.session.user.id),
        ),
      });

      if (existingReview) {
        throw new Error("You have already reviewed this product");
      }

      const [review] = await ctx.db
        .insert(productReviews)
        .values({
          productId: input.productId,
          userId: ctx.session.user.id,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
        })
        .returning();

      return review;
    }),

  // Get product statistics
  stats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.id),
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Get review statistics
      const reviewStats = await ctx.db
        .select({
          averageRating: sql<number>`AVG(${productReviews.rating})`,
          totalReviews: sql<number>`COUNT(*)`,
        })
        .from(productReviews)
        .where(eq(productReviews.productId, input.id));

      return {
        product,
        reviewStats: reviewStats[0] ?? { averageRating: 0, totalReviews: 0 },
      };
    }),
} satisfies TRPCRouterRecord;
