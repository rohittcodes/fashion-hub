export type InteractionType = "view" | "cart" | "purchase" | "wishlist";

export interface UserInteraction {
  userId: string;
  productId: string;
  interactionType: InteractionType;
  occurredAt: Date;
  weight?: number;
}

export interface CollaborativeSignal {
  productId: string;
  score: number;
}

export interface ContentSignal {
  productId: string;
  overlap: number;
}

export interface RecommendationCandidate {
  productId: string;
  signals: {
    collaborative: number;
    content: number;
    trending?: number;
  };
}

export interface RecommendationRequest {
  userId?: string | null;
  productId?: string;
  limit: number;
}

export interface RecommendationContext {
  weightings: {
    view: number;
    cart: number;
    purchase: number;
    wishlist: number;
    collaborative: number;
    content: number;
    trending: number;
  };
  decayHalfLifeHours: number;
}

export interface ProductMetadata {
  id: string;
  name: string;
  categoryId: string | null;
  tagVector: string[];
  price: string;
  image: string | null;
}

export interface RecommendationResult {
  productId: string;
  score: number;
}

