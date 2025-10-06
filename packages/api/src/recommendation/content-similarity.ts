interface MetadataRecord {
  id: string;
  tagVector: string[] | null;
  categoryId: string | null;
}

interface ContentSignalInput {
  seedProductIds: string[];
  candidates: string[];
  metadataById: Map<string, MetadataRecord>;
}

export function computeContentSignals(input: ContentSignalInput) {
  const { seedProductIds, candidates, metadataById } = input;
  if (seedProductIds.length === 0 || candidates.length === 0) {
    return new Map<string, number>();
  }

  const tagFrequency = new Map<string, number>();
  const categoryFrequency = new Map<string, number>();

  for (const productId of seedProductIds) {
    const meta = metadataById.get(productId);
    if (!meta) continue;

    if (meta.tagVector) {
      for (const tag of meta.tagVector) {
        tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
      }
    }

    if (meta.categoryId) {
      categoryFrequency.set(
        meta.categoryId,
        (categoryFrequency.get(meta.categoryId) ?? 0) + 1,
      );
    }
  }

  const signals = new Map<string, number>();
  const maxTagFreq = Math.max(...tagFrequency.values(), 1);
  const maxCategoryFreq = Math.max(...categoryFrequency.values(), 1);

  for (const candidateId of candidates) {
    if (seedProductIds.includes(candidateId)) continue;
    const meta = metadataById.get(candidateId);
    if (!meta) continue;

    let score = 0;

    if (meta.tagVector) {
      for (const tag of meta.tagVector) {
        const freq = tagFrequency.get(tag);
        if (!freq) continue;
        score += freq / maxTagFreq;
      }
    }

    if (meta.categoryId) {
      const freq = categoryFrequency.get(meta.categoryId);
      if (freq) {
        score += 0.75 * (freq / maxCategoryFreq);
      }
    }

    if (score > 0) {
      signals.set(candidateId, Number(score.toFixed(4)));
    }
  }

  return signals;
}
