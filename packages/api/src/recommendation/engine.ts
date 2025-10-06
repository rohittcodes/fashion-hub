import { differenceInHours } from "date-fns";

import type {
  CollaborativeSignal,
  ContentSignal,
  RecommendationCandidate,
  RecommendationContext,
  RecommendationResult,
  UserInteraction,
} from "./types";

const DEFAULT_WEIGHTINGS: RecommendationContext["weightings"] = {
  view: 0.5,
  cart: 0.9,
  purchase: 1.2,
  wishlist: 1.0,
  collaborative: 0.6,
  content: 0.4,
  trending: 0.25,
};

export class RecommendationEngine {
  private readonly context: RecommendationContext;

  constructor(context?: Partial<RecommendationContext>) {
    this.context = {
      weightings: { ...DEFAULT_WEIGHTINGS, ...(context?.weightings ?? {}) },
      decayHalfLifeHours: context?.decayHalfLifeHours ?? 72,
    } satisfies RecommendationContext;
  }

  scoreInteractions(interactions: UserInteraction[]): Map<string, number> {
    const { weightings, decayHalfLifeHours } = this.context;
    const now = new Date();
    const scores = new Map<string, number>();

    for (const interaction of interactions) {
      const base = weightings[interaction.interactionType];
      const ageHours = differenceInHours(now, interaction.occurredAt);
      const decay = 0.5 ** (ageHours / decayHalfLifeHours);
      const weighted = base * decay * (interaction.weight ?? 1);
      scores.set(
        interaction.productId,
        (scores.get(interaction.productId) ?? 0) + weighted,
      );
    }

    return scores;
  }

  mergeSignals(params: {
    personalScores: Map<string, number>;
    collaborative: CollaborativeSignal[];
    content: ContentSignal[];
    trending?: CollaborativeSignal[];
    limit: number;
    excludeProductIds?: Set<string>;
  }): RecommendationResult[] {
    const {
      personalScores,
      collaborative,
      content,
      trending,
      limit,
      excludeProductIds,
    } = params;

    const candidates = new Map<string, RecommendationCandidate>();

    const upsertCandidate = (productId: string): RecommendationCandidate | undefined => {
      if (excludeProductIds?.has(productId)) return undefined;
      const existing = candidates.get(productId);
      if (existing) {
        return existing;
      }

      const created: RecommendationCandidate = {
        productId,
        signals: { collaborative: 0, content: 0, trending: 0 },
      };
      candidates.set(productId, created);
      return created;
    };

    for (const signal of collaborative) {
      const candidate = upsertCandidate(signal.productId);
      if (candidate) {
        candidate.signals.collaborative += signal.score;
      }
    }

    for (const signal of content) {
      const candidate = upsertCandidate(signal.productId);
      if (candidate) {
        candidate.signals.content += signal.overlap;
      }
    }

    if (trending) {
      for (const signal of trending) {
        const candidate = upsertCandidate(signal.productId);
        if (candidate) {
          candidate.signals.trending = (candidate.signals.trending ?? 0) + signal.score;
        }
      }
    }

    // Seed from personal history so that past interactions also surface similar items
    for (const [productId, score] of personalScores.entries()) {
      const candidate = upsertCandidate(productId);
      if (candidate) {
        candidate.signals.collaborative += score;
      }
    }

    const { weightings } = this.context;

    const results: RecommendationResult[] = [];
    for (const candidate of candidates.values()) {
      const collaborativeScore =
        candidate.signals.collaborative * weightings.collaborative;
      const contentScore = candidate.signals.content * weightings.content;
      const trendingScore = (candidate.signals.trending ?? 0) * weightings.trending;
      const personalScore =
        (personalScores.get(candidate.productId) ?? 0) * weightings.view;

      const totalScore = collaborativeScore + contentScore + trendingScore + personalScore;
      if (totalScore <= 0) continue;

      results.push({
        productId: candidate.productId,
        score: Number(totalScore.toFixed(4)),
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

