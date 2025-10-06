"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fh_wishlist_ids";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

export function useWishlist(productId?: string) {
  const [ids, setIds] = useState<Set<string>>(() => readIds());

  // keep in sync across tabs & within app
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIds(readIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        writeIds(next);
        return next;
      });
    },
    [setIds],
  );

  const isWishlisted = useMemo(
    () => (productId ? ids.has(productId) : false),
    [ids, productId],
  );

  return { ids, isWishlisted, toggle } as const;
}
