"use client";

import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import type { RouterInputs } from "@acme/api";

import { useTRPC } from "~/trpc/react";

type InteractionType =
  RouterInputs["recommendation"]["trackInteraction"]["interactionType"];

type InteractionKey = `${string}:${InteractionType}`;

export function useRecommendationTracking() {
  const trpc = useTRPC();
  const mutation = useMutation(
    trpc.recommendation.trackInteraction.mutationOptions(),
  );
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

      if (metadata) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mutation.mutate({
          productId,
          interactionType,
          metadata,
        } as RouterInputs["recommendation"]["trackInteraction"]);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mutation.mutate({
          productId,
          interactionType,
        } as RouterInputs["recommendation"]["trackInteraction"]);
      }
    },
    [mutation],
  );

  return { track, status: mutation.status };
}
