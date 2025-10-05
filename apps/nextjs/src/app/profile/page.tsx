"use client";

import Link from "next/link";
import Image from "next/image";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { useTRPC } from "~/trpc/react";
import { useWishlist } from "~/lib/wishlist";

export default function ProfilePage() {
  const trpc = useTRPC();
  const { data: session } = useSuspenseQuery(trpc.auth.getSession.queryOptions());
  const { ids } = useWishlist();

  const { data: orders } = useSuspenseQuery(
    trpc.order.getUserOrders.queryOptions({ limit: 10 }),
  );

  const { data: products } = useSuspenseQuery(
    trpc.product.all.queryOptions({ limit: 100 }),
  );

  const wishlistProducts = products.filter((p) => ids.has(p.id));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Profile</h1>

      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-xl font-semibold">Account</h2>
        {session?.user ? (
          <p className="text-muted-foreground">
            Signed in as <span className="font-medium">{session.user.email}</span>
          </p>
        ) : (
          <p className="text-muted-foreground">You are not signed in.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Wishlist */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Wishlist</h2>
            <Link href="/products">
              <Button variant="outline" size="sm">Browse Products</Button>
            </Link>
          </div>

          {wishlistProducts.length === 0 ? (
            <p className="text-muted-foreground">No items in wishlist.</p>
          ) : (
            <div className="space-y-3">
              {wishlistProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted">
                  <div className="h-14 w-14 overflow-hidden rounded bg-muted">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} width={56} height={56} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">${p.price}</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link href="/orders">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
                  <div>
                    <p className="font-medium">Order #{o.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${o.total}</p>
                    <p className="text-sm capitalize text-muted-foreground">{o.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
