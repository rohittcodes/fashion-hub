import { addHours } from "date-fns";

/*
  The Drizzle query builder types for selected column objects are not fully inferred
  here, which triggers @typescript-eslint unsafe rules on member access/assignment.
  We constrain outputs via explicit interfaces and casts below, so it's safe to
  locally disable the unsafe rules for this file.
*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type { db } from "@acme/db/client";
import { and, desc, eq, gt, inArray, sql } from "@acme/db";
import {
  cartItems,
  orderItems,
  products,
  userInteractions,
} from "@acme/db/schema";

import type {
  CollaborativeSignal,
  InteractionType,
  UserInteraction,
} from "./types";

interface InteractionRow {
  productId: string;
  interactionType: InteractionType;
  occurredAt: Date;
  weight: string | null;
}

interface SeedUserRow {
  userId: string;
}

interface TrendingRow {
  productId: string;
  sumWeight: string | null;
}

interface AggregateRow {
  productId: string;
  score: string | null;
}

interface RecommendationRepositoryOptions {
  maxInteractionLookbackHours?: number;
  maxSeedProducts?: number;
}

export class RecommendationRepository {
  private readonly options: Required<RecommendationRepositoryOptions>;

  constructor(options?: RecommendationRepositoryOptions) {
    this.options = {
      maxInteractionLookbackHours:
        options?.maxInteractionLookbackHours ?? 24 * 14,
      maxSeedProducts: options?.maxSeedProducts ?? 50,
    };
  }

  async fetchUserInteractions(dbClient: typeof db, userId: string) {
    const cutoff = addHours(
      new Date(),
      -this.options.maxInteractionLookbackHours,
    );
    const interactions = (await dbClient
      .select({
        productId: userInteractions.productId,
        interactionType: userInteractions.interactionType,
        occurredAt: userInteractions.occurredAt,
        weight: userInteractions.weight,
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          gt(userInteractions.occurredAt, cutoff),
        ),
      )
      .orderBy(desc(userInteractions.occurredAt))
      .limit(this.options.maxSeedProducts)) as InteractionRow[];

    return interactions.map<UserInteraction>((row: InteractionRow) => ({
      userId,
      productId: row.productId,
      interactionType: row.interactionType,
      occurredAt: row.occurredAt,
      weight: row.weight ? Number(row.weight) : undefined,
    }));
  }

  async fetchCollaborativeSignals(
    dbClient: typeof db,
    productIds: string[],
    excludeUserId?: string,
  ): Promise<CollaborativeSignal[]> {
    if (productIds.length === 0) return [];

    const seedUsers = (await dbClient
      .selectDistinct({ userId: userInteractions.userId })
      .from(userInteractions)
      .where(inArray(userInteractions.productId, productIds))) as SeedUserRow[];

    const seedUserIds = seedUsers
      .map((row: SeedUserRow) => row.userId)
      .filter((id) => (excludeUserId ? id !== excludeUserId : true));

    if (seedUserIds.length === 0) return [];

    const rows = (await dbClient
      .select({
        productId: userInteractions.productId,
        score: sql<string>`SUM(${userInteractions.weight})`,
      })
      .from(userInteractions)
      .where(inArray(userInteractions.userId, seedUserIds))
      .groupBy(userInteractions.productId)
      .orderBy(desc(sql`SUM(${userInteractions.weight})`))
      .limit(100)) as AggregateRow[];

    return rows
      .filter((row: AggregateRow) => !productIds.includes(row.productId))
      .map((row) => ({
        productId: row.productId,
        score: Number(row.score ?? 0),
      }));
  }

  async fetchTrendingSignals(dbClient: typeof db, hours: number) {
    const cutoff = addHours(new Date(), -hours);

    const interactionRows = (await dbClient
      .select({
        productId: userInteractions.productId,
        sumWeight: sql<string>`SUM(${userInteractions.weight})`,
      })
      .from(userInteractions)
      .where(gt(userInteractions.occurredAt, cutoff))
      .groupBy(userInteractions.productId)
      .orderBy(desc(sql`SUM(${userInteractions.weight})`))
      .limit(50)) as TrendingRow[];

    if (interactionRows.length >= 8) {
      return interactionRows.map((row: TrendingRow) => ({
        productId: row.productId,
        score: Number(row.sumWeight ?? 0),
      }));
    }

    const cartRows = (await dbClient
      .select({
        productId: cartItems.productId,
        score: sql<string>`SUM(${cartItems.quantity})`,
      })
      .from(cartItems)
      .groupBy(cartItems.productId)
      .orderBy(desc(sql`SUM(${cartItems.quantity})`))
      .limit(50)) as AggregateRow[];

    const orderRows = (await dbClient
      .select({
        productId: orderItems.productId,
        score: sql<string>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(50)) as AggregateRow[];

    const merged = new Map<string, number>();
    const addScore = (productId: string, score: string | number | null) => {
      const numeric = typeof score === "number" ? score : Number(score ?? 0);
      merged.set(productId, (merged.get(productId) ?? 0) + numeric);
    };

    for (const row of interactionRows) {
      addScore(row.productId, row.sumWeight);
    }

    for (const row of cartRows) {
      addScore(row.productId, row.score);
    }

    for (const row of orderRows) {
      addScore(row.productId, row.score);
    }

    return [...merged.entries()]
      .map(([productId, score]) => ({ productId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }

  async fetchProductMetadata(dbClient: typeof db, productIds: string[]) {
    if (productIds.length === 0) return [];

    return dbClient
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
        tagVector: products.tags,
        price: products.price,
        image: products.images,
      })
      .from(products)
      .where(inArray(products.id, productIds));
  }
}
