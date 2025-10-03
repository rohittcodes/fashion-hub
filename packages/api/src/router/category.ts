import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, sql } from "@acme/db";
import { categories, CreateCategorySchema, products } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const categoryRouter = {
  // Get all categories
  all: publicProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
        withProductCount: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (!input.includeInactive) {
        conditions.push(eq(categories.isActive, true));
      }

      const baseQuery = ctx.db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          image: categories.image,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(categories.createdAt));

      if (input.withProductCount) {
        return ctx.db
          .select({
            id: categories.id,
            name: categories.name,
            description: categories.description,
            slug: categories.slug,
            image: categories.image,
            isActive: categories.isActive,
            createdAt: categories.createdAt,
            updatedAt: categories.updatedAt,
            productCount: sql<number>`COUNT(${products.id})`,
          })
          .from(categories)
          .leftJoin(
            products,
            and(
              eq(products.categoryId, categories.id),
              eq(products.isActive, true),
            ),
          )
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .groupBy(categories.id)
          .orderBy(desc(categories.createdAt));
      }

      return baseQuery;
    }),

  // Get category by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.id, input.id),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  // Get category by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.slug, input.slug),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  // Get category with products
  withProducts: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.slug, input.slug),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      const orderBy =
        input.sortOrder === "asc"
          ? products[input.sortBy]
          : desc(products[input.sortBy]);

      const categoryProducts = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          slug: products.slug,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          images: products.images,
          isFeatured: products.isFeatured,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(
          and(
            eq(products.categoryId, category.id),
            eq(products.isActive, true),
          ),
        )
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      return {
        category,
        products: categoryProducts,
      };
    }),

  // Create category (admin only)
  create: protectedProcedure
    .input(CreateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existingCategory = await ctx.db.query.categories.findFirst({
        where: eq(categories.slug, input.slug),
      });

      if (existingCategory) {
        throw new Error("Category with this slug already exists");
      }

      const [category] = await ctx.db
        .insert(categories)
        .values(input)
        .returning();

      return category;
    }),

  // Update category (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: CreateCategorySchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If updating slug, check if it already exists
      if (input.data.slug) {
        const existingCategory = await ctx.db.query.categories.findFirst({
          where: and(
            eq(categories.slug, input.data.slug),
            sql`${categories.id} != ${input.id}`,
          ),
        });

        if (existingCategory) {
          throw new Error("Category with this slug already exists");
        }
      }

      const [category] = await ctx.db
        .update(categories)
        .set(input.data)
        .where(eq(categories.id, input.id))
        .returning();

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  // Delete category (admin only)
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check if category has products
      const productsInCategory = await ctx.db.query.products.findFirst({
        where: eq(products.categoryId, input),
      });

      if (productsInCategory) {
        throw new Error(
          "Cannot delete category that has products. Please move or delete products first.",
        );
      }

      const [category] = await ctx.db
        .delete(categories)
        .where(eq(categories.id, input))
        .returning();

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  // Toggle category active status (admin only)
  toggleActive: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.id, input),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      const [updatedCategory] = await ctx.db
        .update(categories)
        .set({ isActive: !category.isActive })
        .where(eq(categories.id, input))
        .returning();

      return updatedCategory;
    }),

  // Get category statistics
  stats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.id, input.id),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // Get product count and price range
      const stats = await ctx.db
        .select({
          totalProducts: sql<number>`COUNT(*)`,
          activeProducts: sql<number>`COUNT(CASE WHEN ${products.isActive} = true THEN 1 END)`,
          minPrice: sql<string>`MIN(${products.price})`,
          maxPrice: sql<string>`MAX(${products.price})`,
          avgPrice: sql<string>`AVG(${products.price})`,
        })
        .from(products)
        .where(eq(products.categoryId, input.id));

      return {
        category,
        stats: stats[0] ?? {
          totalProducts: 0,
          activeProducts: 0,
          minPrice: "0.00",
          maxPrice: "0.00",
          avgPrice: "0.00",
        },
      };
    }),
} satisfies TRPCRouterRecord;
