"use client";

import { useCallback, useRef } from "react";

import type { RouterInputs } from "@acme/api";

import { useTRPC } from "~/trpc/react";

type InteractionType =
  RouterInputs["recommendation"]["trackInteraction"]["interactionType"];

type InteractionKey = `${string}:${InteractionType}`;

export function useRecommendationTracking() {
  const trpc = useTRPC();
  const mutation = trpc.recommendation.trackInteraction.useMutation();
  const sentInteractions = useRef<Set<InteractionKey>>(new Set());

  const track = useCallback(
    (
      productId: string,
      interactionType: InteractionType,
      metadata?: Record<string, unknown>,
    ) => {
      const key: InteractionKey = `${productId}:${interactionType}`;
      if (interactionType === "view" && sentInteractions.current.has(key)) {
        return;
      }

      if (interactionType === "view") {
        sentInteractions.current.add(key);
      }

      mutation.mutate(
        { productId, interactionType, metadata },
        {
          onError: (error) => {
            if (error.data?.code !== "UNAUTHORIZED") {
              console.warn("Failed to track interaction", error);
            }
          },
        },
      );
    },
    [mutation],
  );

  return { track, status: mutation.status };
}
