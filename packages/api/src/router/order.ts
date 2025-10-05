import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, sql } from "@acme/db";
import {
  cartItems,
  categories,
  orderItems,
  orders,
  products,
} from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

export const orderRouter = {
  // Get user's orders
  getUserOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        status: z
          .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      const conditions = [eq(orders.userId, ctx.session.user.id)];

      if (input.status) {
        conditions.push(eq(orders.status, input.status));
      }

      const userOrders = await ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.tax,
          shipping: orders.shipping,
          total: orders.total,
          currency: orders.currency,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return userOrders;
    }),

  // Get order by ID with items
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.id),
          eq(orders.userId, ctx.session.user.id),
        ),
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Get order items with product details
      const orderItemsWithProducts = await ctx.db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          productId: products.id,
          productName: products.name,
          productDescription: products.description,
          productSlug: products.slug,
          productImages: products.images,
          categoryId: categories.id,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(orderItems.orderId, input.id));

      return {
        ...order,
        items: orderItemsWithProducts.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          product: {
            id: item.productId,
            name: item.productName,
            description: item.productDescription,
            slug: item.productSlug,
            images: item.productImages,
            category: {
              id: item.categoryId,
              name: item.categoryName,
              slug: item.categorySlug,
            },
          },
        })),
      };
    }),

  // Get order by order number
  byOrderNumber: protectedProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.orderNumber, input.orderNumber),
          eq(orders.userId, ctx.session.user.id),
        ),
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    }),

  // Create order from cart
  createFromCart: protectedProcedure
    .input(
      z.object({
        shippingAddress: z.string(),
        billingAddress: z.string(),
        notes: z.string().max(500).optional(),
        taxRate: z.number().min(0).max(1).default(0.08), // 8% tax
        shippingCost: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
      console.log("[order.createFromCart] input:", {
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        hasNotes: Boolean(input.notes && input.notes.length > 0),
        taxRate: input.taxRate,
        shippingCost: input.shippingCost,
      });
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      // Get cart items with product details
      const cartItemsWithProducts = await ctx.db
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

      if (cartItemsWithProducts.length === 0) {
        throw new Error("Cart is empty");
      }

      console.log("[order.createFromCart] cart items:", cartItemsWithProducts.length);

      // Validate cart items
      const invalidItems = cartItemsWithProducts.filter((item) => {
        const product = item.product as {
          isActive: boolean;
          inventory: number;
        } | null;
        return (
          !product || !product.isActive || product.inventory < item.quantity
        );
      });

      if (invalidItems.length > 0) {
        throw new Error(
          "Some items in your cart are no longer available or have insufficient inventory",
        );
      }

      // Calculate totals
      const subtotal = cartItemsWithProducts.reduce((sum, item) => {
        const product = item.product as { price: string };
        return sum + parseFloat(product.price) * item.quantity;
      }, 0);

      const tax = subtotal * input.taxRate;
      const shipping = input.shippingCost;
      const total = subtotal + tax + shipping;

      console.log("[order.createFromCart] totals:", {
        subtotal,
        tax,
        shipping,
        total,
      });

      // Create order
      const orderNumber = generateOrderNumber();
      const [order] = await ctx.db
        .insert(orders)
        .values({
          userId: ctx.session.user.id,
          orderNumber,
          status: "pending",
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
          currency: "USD",
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          notes: input.notes,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      if (!order) {
        throw new Error("Failed to create order");
      }

      console.log("[order.createFromCart] order created:", order);

      // Create order items and update inventory
      console.log("[order.createFromCart] preparing order items insert...");
      const orderItemsData = cartItemsWithProducts.map((item) => {
        const product = item.product as { id: string; price: string };
        return {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        };
      });
      console.log("[order.createFromCart] inserting order items:", orderItemsData.length);
      if (orderItemsData.length > 0) {
        const sample = orderItemsData[0] as unknown as Record<string, unknown>;
        console.log("[order.createFromCart] sample order item:", sample);
        console.log(
          "[order.createFromCart] sample types:",
          {
            orderId: typeof sample.orderId,
            productId: typeof sample.productId,
            quantity: typeof sample.quantity,
            price: typeof sample.price,
          },
        );
      }
      try {
        await ctx.db.insert(orderItems).values(orderItemsData);
      } catch (e) {
        console.error("[order.createFromCart] insert orderItems failed:", e);
        throw e;
      }
      console.log("[order.createFromCart] order items inserted");

      // Update product inventory
      console.log("[order.createFromCart] updating inventory for items:", cartItemsWithProducts.length);
      for (const item of cartItemsWithProducts) {
        const product = item.product as { id: string };
        console.log("[order.createFromCart] decrement inventory for product:", product.id, "by", item.quantity);
        await ctx.db
          .update(products)
          .set({
            inventory: sql`${products.inventory} - ${item.quantity}`,
          })
          .where(eq(products.id, product.id));
      }
      console.log("[order.createFromCart] inventory updated");

      // Clear cart
      console.log("[order.createFromCart] clearing cart for user:", ctx.session.user.id);
      await ctx.db
        .delete(cartItems)
        .where(eq(cartItems.userId, ctx.session.user.id));
      console.log("[order.createFromCart] cart cleared");

      const payload: { id: string; orderNumber: string } = {
        id: order.id,
        orderNumber: order.orderNumber,
      };
      console.log("[order.createFromCart] success payload:", payload);
      return payload;
      } catch (err) {
        console.error("[order.createFromCart] error:", err);
        throw err;
      }
    }),

  // Create order directly (admin or for specific use cases)
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
          }),
        ),
        shippingAddress: z.string(),
        billingAddress: z.string(),
        notes: z.string().max(500).optional(),
        taxRate: z.number().min(0).max(1).default(0.08),
        shippingCost: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
      // Get products and validate
      const productsData = await ctx.db
        .select()
        .from(products)
        .where(
          sql`${products.id} IN (${input.items.map((item) => `'${item.productId}'`).join(",")})`,
        );

      if (productsData.length !== input.items.length) {
        throw new Error("Some products not found");
      }

      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => {
        const product = productsData.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error("Product not found");
        }
        return sum + parseFloat(product.price) * item.quantity;
      }, 0);

      const tax = subtotal * input.taxRate;
      const shipping = input.shippingCost;
      const total = subtotal + tax + shipping;

      // Create order
      const orderNumber = generateOrderNumber();
      const [order] = await ctx.db
        .insert(orders)
        .values({
          userId: input.userId,
          orderNumber,
          status: "pending",
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
          currency: "USD",
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          notes: input.notes,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      if (!order) {
        throw new Error("Failed to create order");
      }

      // Create order items
      const orderItemsData = input.items.map((item) => {
        const product = productsData.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error("Product not found");
        }
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
      });

      await ctx.db.insert(orderItems).values(orderItemsData);

      const payload: { id: string; orderNumber: string } = {
        id: order.id,
        orderNumber: order.orderNumber,
      };
      return payload;
      } catch (err) {
        console.error("[order.create] error:", err);
        throw err;
      }
    }),

  // Update order status (admin only)
  updateStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    }),

  // Cancel order
  cancel: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new Error("User not authenticated");
      }

      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.id, input),
          eq(orders.userId, ctx.session.user.id),
        ),
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "cancelled") {
        throw new Error("Order is already cancelled");
      }

      if (order.status === "delivered") {
        throw new Error("Cannot cancel delivered order");
      }

      // Update order status
      const [updatedOrder] = await ctx.db
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, input))
        .returning();

      // Restore inventory if order was not shipped
      if (order.status !== "shipped") {
        const orderItemsData = await ctx.db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, input));

        for (const item of orderItemsData) {
          await ctx.db
            .update(products)
            .set({
              inventory: sql`${products.inventory} + ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }
      }

      return updatedOrder;
    }),

  // Get order statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.id) {
      throw new Error("User not authenticated");
    }

    const stats = await ctx.db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        totalSpent: sql<string>`SUM(${orders.total})`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`,
        processingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'processing' THEN 1 END)`,
        shippedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`,
        deliveredOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
        cancelledOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
      })
      .from(orders)
      .where(eq(orders.userId, ctx.session.user.id));

    return (
      stats[0] ?? {
        totalOrders: 0,
        totalSpent: "0.00",
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      }
    );
  }),

  // Get all orders (admin only)
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z
          .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
          .optional(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.status) {
        conditions.push(eq(orders.status, input.status));
      }

      if (input.userId) {
        conditions.push(eq(orders.userId, input.userId));
      }

      const allOrders = await ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          userId: orders.userId,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.tax,
          shipping: orders.shipping,
          total: orders.total,
          currency: orders.currency,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return allOrders;
    }),
} satisfies TRPCRouterRecord;
