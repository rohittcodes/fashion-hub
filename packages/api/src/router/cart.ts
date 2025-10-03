import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { desc, eq, and, sql } from "@acme/db";
import { 
  cartItems, 
  products,
  categories
} from "@acme/db/schema";
import { protectedProcedure } from "../trpc";

export const cartRouter = {
  // Get user's cart items
  get: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const items = await ctx.db
        .select({
          id: cartItems.id,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          updatedAt: cartItems.updatedAt,
          productId: products.id,
          productName: products.name,
          productDescription: products.description,
          productSlug: products.slug,
          productPrice: products.price,
          productCompareAtPrice: products.compareAtPrice,
          productImages: products.images,
          productInventory: products.inventory,
          productIsActive: products.isActive,
          categoryId: categories.id,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(cartItems.userId, ctx.session.user.id))
        .orderBy(desc(cartItems.createdAt));
      
      // Calculate totals
      const totals = items.reduce(
        (acc, item) => {
          const price = parseFloat(item.productPrice ?? "0");
          const quantity = item.quantity;
          const subtotal = price * quantity;
          
          return {
            subtotal: acc.subtotal + subtotal,
            itemCount: acc.itemCount + quantity,
          };
        },
        { subtotal: 0, itemCount: 0 }
      );
      
      return {
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          product: {
            id: item.productId,
            name: item.productName,
            description: item.productDescription,
            slug: item.productSlug,
            price: item.productPrice,
            compareAtPrice: item.productCompareAtPrice,
            images: item.productImages,
            inventory: item.productInventory,
            isActive: item.productIsActive,
            category: {
              id: item.categoryId,
              name: item.categoryName,
              slug: item.categorySlug,
            },
          },
        })),
        totals: {
          subtotal: totals.subtotal.toFixed(2),
          itemCount: totals.itemCount,
        },
      };
    }),

  // Add item to cart
  add: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      // Check if product exists and is active
      const product = await ctx.db.query.products.findFirst({
        where: and(
          eq(products.id, input.productId),
          eq(products.isActive, true)
        ),
      });
      
      if (!product) {
        throw new Error("Product not found or inactive");
      }
      
      // Check inventory
      if (product.inventory < input.quantity) {
        throw new Error("Insufficient inventory");
      }
      
      // Check if item already exists in cart
      const existingItem = await ctx.db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.userId, ctx.session.user.id),
          eq(cartItems.productId, input.productId)
        ),
      });
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + input.quantity;
        
        if (product.inventory < newQuantity) {
          throw new Error("Insufficient inventory");
        }
        
        const [updatedItem] = await ctx.db
          .update(cartItems)
          .set({ quantity: newQuantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        
        return updatedItem;
      } else {
        // Add new item
        const [newItem] = await ctx.db
          .insert(cartItems)
          .values({
            userId: ctx.session.user.id,
            productId: input.productId,
            quantity: input.quantity,
          })
          .returning();
        
        return newItem;
      }
    }),

  // Update cart item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      // Get cart item with product info
      const cartItem = await ctx.db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.id, input.cartItemId),
          eq(cartItems.userId, ctx.session.user.id)
        ),
        with: {
          product: true,
        },
      });
      
      if (!cartItem) {
        throw new Error("Cart item not found");
      }
      
      // Check inventory
      const product = cartItem.product as { inventory: number };
      if (product.inventory < input.quantity) {
        throw new Error("Insufficient inventory");
      }
      
      const [updatedItem] = await ctx.db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.cartItemId))
        .returning();
      
      return updatedItem;
    }),

  // Remove item from cart
  remove: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const [removedItem] = await ctx.db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.id, input),
            eq(cartItems.userId, ctx.session.user.id)
          )
        )
        .returning();
      
      if (!removedItem) {
        throw new Error("Cart item not found");
      }
      
      return removedItem;
    }),

  // Clear entire cart
  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const deletedItems = await ctx.db
        .delete(cartItems)
        .where(eq(cartItems.userId, ctx.session.user.id))
        .returning();
      
      return { deletedCount: deletedItems.length };
    }),

  // Get cart item count
  getCount: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const result = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
          totalQuantity: sql<number>`SUM(${cartItems.quantity})`,
        })
        .from(cartItems)
        .where(eq(cartItems.userId, ctx.session.user.id));
      
      return {
        itemCount: result[0]?.count ?? 0,
        totalQuantity: result[0]?.totalQuantity ?? 0,
      };
    }),

  // Validate cart items (check inventory, active status, etc.)
  validate: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const items = await ctx.db
        .select({
          id: cartItems.id,
          quantity: cartItems.quantity,
          product: {
            id: products.id,
            name: products.name,
            price: products.price,
            inventory: products.inventory,
            isActive: products.isActive,
          },
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, ctx.session.user.id));
      
      const validationResults = items.map((item) => {
        const issues = [];
        
        if (!item.product) {
          issues.push("Product no longer exists");
        } else {
          if (!item.product.isActive) {
            issues.push("Product is no longer available");
          }
          if (item.product.inventory < item.quantity) {
            issues.push("Insufficient inventory");
          }
        }
        
        return {
          cartItemId: item.id,
          productId: item.product?.id,
          productName: item.product?.name,
          quantity: item.quantity,
          issues,
          isValid: issues.length === 0,
        };
      });
      
      const invalidItems = validationResults.filter((item) => !item.isValid);
      const validItems = validationResults.filter((item) => item.isValid);
      
      return {
        validItems,
        invalidItems,
        hasIssues: invalidItems.length > 0,
      };
    }),

  // Merge cart items (useful for when user logs in)
  merge: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }
      
      const results = [];
      
      for (const item of input.items) {
        try {
          // Check if product exists and is active
          const product = await ctx.db.query.products.findFirst({
            where: and(
              eq(products.id, item.productId),
              eq(products.isActive, true)
            ),
          });
          
          if (!product) {
            results.push({
              productId: item.productId,
              success: false,
              error: "Product not found or inactive",
            });
            continue;
          }
          
          // Check if item already exists in cart
          const existingItem = await ctx.db.query.cartItems.findFirst({
            where: and(
              eq(cartItems.userId, ctx.session.user.id),
              eq(cartItems.productId, item.productId)
            ),
          });
          
          if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + item.quantity;
            
            if (product.inventory < newQuantity) {
              results.push({
                productId: item.productId,
                success: false,
                error: "Insufficient inventory",
              });
              continue;
            }
            
            await ctx.db
              .update(cartItems)
              .set({ quantity: newQuantity })
              .where(eq(cartItems.id, existingItem.id));
            
            results.push({
              productId: item.productId,
              success: true,
              action: "updated",
            });
          } else {
            // Add new item
            await ctx.db.insert(cartItems).values({
              userId: ctx.session.user.id,
              productId: item.productId,
              quantity: item.quantity,
            });
            
            results.push({
              productId: item.productId,
              success: true,
              action: "added",
            });
          }
        } catch (error) {
          results.push({
            productId: item.productId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      
      return results;
    }),
} satisfies TRPCRouterRecord;
