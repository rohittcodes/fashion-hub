import { sql } from "drizzle-orm";
import { pgTable, text, decimal, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categories = pgTable("categories", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text(),
  slug: text().notNull().unique(),
  image: text(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
});

export const products = pgTable("products", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text(),
  slug: text().notNull().unique(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal({ precision: 10, scale: 2 }),
  sku: text().unique(),
  inventory: integer().notNull().default(0),
  weight: decimal({ precision: 8, scale: 2 }),
  categoryId: uuid().references(() => categories.id),
  images: text().array(), // Array of image URLs
  isActive: boolean().notNull().default(true),
  isFeatured: boolean().notNull().default(false),
  tags: text().array(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
});

export const orders = pgTable("orders", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  userId: text().notNull(), // References user.id from auth schema
  orderNumber: text().notNull().unique(),
  status: text().notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
  tax: decimal({ precision: 10, scale: 2 }).notNull().default("0.00"),
  shipping: decimal({ precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal({ precision: 10, scale: 2 }).notNull(),
  currency: text().notNull().default("USD"),
  shippingAddress: text().notNull(), // JSON string of address
  billingAddress: text().notNull(), // JSON string of address
  notes: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
});

export const orderItems = pgTable("order_items", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  orderId: uuid().notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid().notNull().references(() => products.id),
  quantity: integer().notNull(),
  price: decimal({ precision: 10, scale: 2 }).notNull(), // Price at time of order
  createdAt: timestamp().defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  userId: text().notNull(), // References user.id from auth schema
  productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
});

export const productReviews = pgTable("product_reviews", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: text().notNull(), // References user.id from auth schema
  rating: integer().notNull(), // 1-5 stars
  title: text(),
  comment: text(),
  isVerified: boolean().notNull().default(false),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
});

export const CreateCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(100),
  image: z.string().url().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateProductSchema = createInsertSchema(products, {
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  slug: z.string().min(1).max(200),
  price: z.string().regex(/^\d+\.\d{2}$/, "Price must be in format 0.00"),
  compareAtPrice: z.string().regex(/^\d+\.\d{2}$/, "Compare price must be in format 0.00").optional(),
  sku: z.string().max(50).optional(),
  inventory: z.number().int().min(0),
  weight: z.string().regex(/^\d+\.\d{2}$/, "Weight must be in format 0.00").optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateOrderSchema = createInsertSchema(orders, {
  orderNumber: z.string().min(1),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  subtotal: z.string().regex(/^\d+\.\d{2}$/),
  tax: z.string().regex(/^\d+\.\d{2}$/),
  shipping: z.string().regex(/^\d+\.\d{2}$/),
  total: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  shippingAddress: z.string(),
  billingAddress: z.string(),
  notes: z.string().max(500).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateOrderItemSchema = createInsertSchema(orderItems, {
  quantity: z.number().int().min(1),
  price: z.string().regex(/^\d+\.\d{2}$/),
}).omit({
  id: true,
  createdAt: true,
});

export const CreateCartItemSchema = createInsertSchema(cartItems, {
  quantity: z.number().int().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateProductReviewSchema = createInsertSchema(productReviews, {
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
export { user } from "./auth-schema";
