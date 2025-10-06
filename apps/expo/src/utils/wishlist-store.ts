import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";

const WISHLIST_KEY = "wishlist:default";

type Subscriber = () => void;

class WishlistStore {
  private productIdSet: Set<string> = new Set<string>();
  private initialized = false;
  private subscribers: Set<Subscriber> = new Set<Subscriber>();

  private notify() {
    for (const sub of this.subscribers) sub();
  }

  private async ensureLoaded() {
    if (this.initialized) return;
    try {
      const raw = await SecureStore.getItemAsync(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) {
          this.productIdSet = new Set(parsed);
        }
      }
    } catch {
      this.productIdSet = new Set<string>();
    } finally {
      this.initialized = true;
    }
  }

  private async persist() {
    try {
      await SecureStore.setItemAsync(
        WISHLIST_KEY,
        JSON.stringify(Array.from(this.productIdSet)),
      );
    } catch {
      // ignore
    }
  }

  subscribe(callback: Subscriber) {
    this.subscribers.add(callback);
    // Ensure state is loaded for new subscribers, then notify once
    void this.ensureLoaded().then(() => this.notify());
    return () => this.subscribers.delete(callback);
  }

  getSnapshot(): ReadonlySet<string> {
    return this.productIdSet;
  }

  async toggle(productId: string): Promise<boolean> {
    await this.ensureLoaded();
    const next = new Set(this.productIdSet);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    this.productIdSet = next;
    await this.persist();
    this.notify();
    return this.productIdSet.has(productId);
  }

  async add(productId: string): Promise<void> {
    await this.ensureLoaded();
    if (!this.productIdSet.has(productId)) {
      this.productIdSet = new Set(this.productIdSet);
      this.productIdSet.add(productId);
      await this.persist();
      this.notify();
    }
  }

  async remove(productId: string): Promise<void> {
    await this.ensureLoaded();
    if (this.productIdSet.has(productId)) {
      const next = new Set(this.productIdSet);
      next.delete(productId);
      this.productIdSet = next;
      await this.persist();
      this.notify();
    }
  }

  async isWishlisted(productId: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.productIdSet.has(productId);
  }
}

export const wishlistStore = new WishlistStore();

export function useWishlist(productId?: string) {
  const subscribe = (cb: () => void) => wishlistStore.subscribe(cb);
  const getSnapshot = () => wishlistStore.getSnapshot();
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isWishlisted = productId ? ids.has(productId) : false;

  return {
    isWishlisted,
    toggle: (id: string) => wishlistStore.toggle(id),
    add: (id: string) => wishlistStore.add(id),
    remove: (id: string) => wishlistStore.remove(id),
    ids,
  } as const;
}
