import type { db } from "@acme/db/client";

import { RecommendationEngine } from "./engine";
import { computeContentSignals } from "./content-similarity";
import { RecommendationRepository } from "./repository";
import type { RecommendationRequest, RecommendationResult } from "./types";

type DbClient = typeof db;

export class RecommendationService {
  private readonly engine = new RecommendationEngine();
  private readonly repository = new RecommendationRepository();

  constructor(private readonly db: DbClient) {}

  async recommendForUser(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, limit } = request;

    if (!userId) {
      const trending = await this.repository.fetchTrendingSignals(this.db, 24 * 7);
      return trending.slice(0, limit).map((item, index) => ({
        productId: item.productId,
        score: Number((item.score * (1 - index * 0.02)).toFixed(4)),
      }));
    }

    const interactions = await this.repository.fetchUserInteractions(this.db, userId);
    const personalScores = this.engine.scoreInteractions(interactions);
    const seedProductIds = [...personalScores.keys()];

    const collaborativeSignals = await this.repository.fetchCollaborativeSignals(
      this.db,
      seedProductIds,
      userId,
    );

    const trendingSignals = await this.repository.fetchTrendingSignals(this.db, 24 * 3);

    const candidateIds = new Set<string>([
      ...seedProductIds,
      ...collaborativeSignals.map((c) => c.productId),
      ...trendingSignals.map((t) => t.productId),
    ]);

    const metadataRows = await this.repository.fetchProductMetadata(
      this.db,
      [...candidateIds],
    );

    const metadataById = new Map(
      metadataRows.map((row) => [
        row.id,
        {
          id: row.id,
          tagVector: row.tagVector ?? [],
          categoryId: row.categoryId,
        },
      ]),
    );

    const contentSignals = computeContentSignals({
      seedProductIds,
      candidates: [...candidateIds],
      metadataById,
    });

    const merged = this.engine.mergeSignals({
      personalScores,
      collaborative: collaborativeSignals,
      content: [...contentSignals.entries()].map(([productId, overlap]) => ({
        productId,
        overlap,
      })),
      trending: trendingSignals,
      limit,
      excludeProductIds: new Set(seedProductIds),
    });

    if (merged.length >= limit) {
      return merged;
    }

    const fallback = trendingSignals
      .filter((item) => !seedProductIds.includes(item.productId))
      .map((item) => ({ productId: item.productId, score: item.score }));

    return [...merged, ...fallback].slice(0, limit);
  }

  async similarToProduct(
    request: Required<Pick<RecommendationRequest, "productId">> & { limit: number; userId?: string },
  ) {
    const { productId, limit, userId } = request;
    const collaborativeSignals = await this.repository.fetchCollaborativeSignals(
      this.db,
      [productId],
      userId,
    );

    const metadataRows = await this.repository.fetchProductMetadata(
      this.db,
      [productId, ...collaborativeSignals.map((row) => row.productId)],
    );

    const metadataById = new Map(
      metadataRows.map((row) => [
        row.id,
        {
          id: row.id,
          tagVector: row.tagVector ?? [],
          categoryId: row.categoryId,
        },
      ]),
    );

    const contentSignals = computeContentSignals({
      seedProductIds: [productId],
      candidates: [...metadataById.keys()],
      metadataById,
    });

    const merged = this.engine.mergeSignals({
      personalScores: new Map(),
      collaborative: collaborativeSignals,
      content: [...contentSignals.entries()].map(([id, overlap]) => ({
        productId: id,
        overlap,
      })),
      limit,
      excludeProductIds: new Set([productId]),
    });

    return merged.slice(0, limit);
  }

  async trending(limit: number) {
    const trendingSignals = await this.repository.fetchTrendingSignals(this.db, 24 * 7);
    return trendingSignals.slice(0, limit).map((item) => ({
      productId: item.productId,
      score: Number(item.score.toFixed(4)),
    }));
  }
}
