"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

// Define proper types
interface CartItemType {
  id: string;
  quantity: number;
  product: {
    id: string | null;
    name: string | null;
    slug: string | null;
    price: string | null;
    inventory: number | null;
    images?: string[] | null;
    category?: {
      name: string | null;
    };
  };
}

interface CartTotalsType {
  subtotal: string;
  itemCount: number;
}

// Cart Item Component
export function CartItem(props: { item: CartItemType }) {
  const { item } = props;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateQuantity = useMutation(
    trpc.cart.updateQuantity.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.cart.get.queryFilter());
      },
      onError: () => {
        toast.error("Failed to update quantity");
      },
    })
  );

  const removeItem = useMutation(
    trpc.cart.remove.mutationOptions({
      onSuccess: async () => {
        toast.success("Item removed from cart");
        await queryClient.invalidateQueries(trpc.cart.get.queryFilter());
      },
      onError: () => {
        toast.error("Failed to remove item");
      },
    })
  );

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (item.product.inventory && newQuantity > item.product.inventory) {
      toast.error("Not enough inventory");
      return;
    }
    updateQuantity.mutate({
      cartItemId: item.id,
      quantity: newQuantity,
    });
  };

  const handleRemove = () => {
    removeItem.mutate(item.id);
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <Link href={`/products/${item.product.slug}`}>
        <div className="h-20 w-20 overflow-hidden rounded-md bg-muted">
          {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
            <Image
              src={item.product.images[0]}
              alt={item.product.name ?? "Product"}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1">
        <Link href={`/products/${item.product.slug}`}>
          <h3 className="font-semibold text-foreground hover:text-primary">
            {item.product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground">
          {item.product.category?.name}
        </p>
        <p className="text-sm text-muted-foreground">
          ${item.product.price} each
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={updateQuantity.isPending || item.quantity <= 1}
        >
          -
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={
            updateQuantity.isPending || 
            (item.product.inventory ? item.quantity >= item.product.inventory : false)
          }
        >
          +
        </Button>
      </div>

      <div className="text-right">
        <p className="font-semibold">
          ${(parseFloat(item.product.price ?? "0") * item.quantity).toFixed(2)}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemove}
          disabled={removeItem.isPending}
          className="text-destructive hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

// Cart Summary Component
export function CartSummary(props: { totals: CartTotalsType }) {
  const { totals } = props;
  const subtotal = parseFloat(totals.subtotal);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal ({totals.itemCount} items)</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        
        {subtotal < 50 && (
          <p className="text-sm text-muted-foreground">
            Add ${(50 - subtotal).toFixed(2)} more for free shipping!
          </p>
        )}
        
        <div className="border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <Button className="mt-4 w-full" size="lg">
        Proceed to Checkout
      </Button>
    </div>
  );
}

// Cart List Component
export function CartList() {
  const trpc = useTRPC();
  const { data: cart } = useSuspenseQuery(trpc.cart.get.queryOptions());

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Add some products to get started!
          </p>
          <Link href="/products">
            <Button className="mt-4">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cart.items.map((item: CartItemType) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}

// Cart Page Component
export function CartPage() {
  const trpc = useTRPC();
  const { data: cart } = useSuspenseQuery(trpc.cart.get.queryOptions());

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartList />
        </div>
        
        <div>
          <CartSummary totals={cart.totals} />
        </div>
      </div>
    </div>
  );
}

// Cart Icon Component (for header)
export function CartIcon() {
  const trpc = useTRPC();
  const { data: cartCount } = useSuspenseQuery(
    trpc.cart.getCount.queryOptions()
  );

  return (
    <Link href="/cart" className="relative">
      <Button variant="ghost" size="sm">
        Cart ({cartCount.totalQuantity})
      </Button>
      {cartCount.totalQuantity > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {cartCount.totalQuantity}
        </span>
      )}
    </Link>
  );
}