"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [shipping, setShipping] = useState("");
  const [billing, setBilling] = useState("");
  const [notes, setNotes] = useState("");

  const createOrder = useMutation(
    trpc.order.createFromCart.mutationOptions({
      onSuccess: (order) => {
        toast.success(`Order #${order.orderNumber} placed`);
        router.replace("/");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Please try again";
        toast.error(message);
      },
    }),
  );

  const canSubmit = shipping.trim().length > 0 && billing.trim().length > 0 && !createOrder.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Shipping Address</label>
          <Textarea
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
            placeholder="123 Main St, City, Country"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Billing Address</label>
          <Textarea
            value={billing}
            onChange={(e) => setBilling(e.target.value)}
            placeholder="Same as shipping or enter different address"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Notes (optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery instructions, etc."
            rows={3}
          />
        </div>
        <Button
          disabled={!canSubmit}
          onClick={() =>
            createOrder.mutate({
              shippingAddress: shipping.trim(),
              billingAddress: billing.trim(),
              notes: notes.trim(),
            })
          }
          className="w-full"
        >
          {createOrder.isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}



