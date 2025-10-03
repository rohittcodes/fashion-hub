"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import { useTRPC } from "~/trpc/react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  inventory: number;
  images: string[] | null;
  isFeatured: boolean;
}

export function ProductManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get products using tRPC
  const { data: products, isLoading } = useQuery(
    trpc.product.all.queryOptions({
      limit: 100,
    }),
  );

  // Create product mutation
  const createProduct = useMutation(
    trpc.product.create.mutationOptions({
      onSuccess: () => {
        setShowCreateForm(false);
        void queryClient.invalidateQueries(trpc.product.all.queryFilter());
      },
    }),
  );

  // Update product mutation
  const updateProduct = useMutation(
    trpc.product.update.mutationOptions({
      onSuccess: () => {
        setEditingProduct(null);
        void queryClient.invalidateQueries(trpc.product.all.queryFilter());
      },
    }),
  );

  // Delete product mutation
  const deleteProduct = useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.product.all.queryFilter());
      },
    }),
  );

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    createProduct.mutate({
      name,
      slug,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      categoryId: formData.get("categoryId") as string,
      sku: formData.get("sku") as string,
      inventory: parseInt(formData.get("inventory") as string),
      images: (() => {
        const image = formData.get("image") as string;
        return image ? [image] : [];
      })(),
      isFeatured: formData.get("isFeatured") === "on",
    });
  };

  const handleUpdateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!editingProduct) return;

    updateProduct.mutate({
      id: editingProduct.id,
      data: {
        name,
        slug,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        categoryId: formData.get("categoryId") as string,
        sku: formData.get("sku") as string,
        inventory: parseInt(formData.get("inventory") as string),
        images: (() => {
          const image = formData.get("image") as string;
          return image ? [image] : [];
        })(),
        isFeatured: formData.get("isFeatured") === "on",
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i: number) => (
              <div key={i} className="h-4 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Product Management
        </h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Product"}
        </Button>
      </div>

      {/* Create Product Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-4 text-lg font-medium">Create New Product</h3>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required />
              </div>
              <div>
                <Label htmlFor="inventory">Inventory</Label>
                <Input id="inventory" name="inventory" type="number" required />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" type="url" />
            </div>
            <div className="flex items-center">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isFeatured" className="ml-2">
                Featured Product
              </Label>
            </div>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </div>
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-4 text-lg font-medium">Edit Product</h3>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct.price}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  name="sku"
                  defaultValue={editingProduct.sku ?? ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-inventory">Inventory</Label>
                <Input
                  id="edit-inventory"
                  name="inventory"
                  type="number"
                  defaultValue={editingProduct.inventory}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                rows={3}
                defaultValue={editingProduct.description ?? ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                name="image"
                type="url"
                defaultValue={editingProduct.images?.[0] ?? ""}
              />
            </div>
            <div className="flex items-center">
              <input
                id="edit-isFeatured"
                name="isFeatured"
                type="checkbox"
                defaultChecked={editingProduct.isFeatured}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="edit-isFeatured" className="ml-2">
                Featured Product
              </Label>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Updating..." : "Update Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Inventory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products?.map((product: Product) => (
              <tr key={product.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">{product.sku}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ${product.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {product.inventory}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {product.isFeatured ? (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      Featured
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                      Regular
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this product?",
                          )
                        ) {
                          deleteProduct.mutate(product.id);
                        }
                      }}
                      disabled={deleteProduct.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products?.length === 0 && (
        <div className="py-8 text-center text-gray-500">No products found</div>
      )}
    </div>
  );
}
