"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import { useTRPC } from "~/trpc/react";
import Image from "next/image";
import { ImageUploadButton } from "~/components/uploadthing";

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

interface Category {
  id: string;
  name: string;
}

export function ProductManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get products using tRPC
  const { data: products, isLoading } = useQuery(
    trpc.product.all.queryOptions({
      limit: 100,
    }),
  );

  // Get categories for select
  const { data: categories } = useQuery(
    trpc.category.all.queryOptions({ includeInactive: false }),
  );

  const [productSearch, setProductSearch] = useState("");

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

    // Format price to ensure it has exactly 2 decimal places
    const priceValue = parseFloat(formData.get("price") as string);
    const formattedPrice = priceValue.toFixed(2);

    createProduct.mutate({
      name,
      slug,
      description: formData.get("description") as string,
      price: formattedPrice,
      categoryId: formData.get("categoryId") as string,
      sku: formData.get("sku") as string,
      inventory: parseInt(formData.get("inventory") as string),
      images: uploadedImageUrl ? [uploadedImageUrl] : [],
      isFeatured: formData.get("isFeatured") === "on",
    });
    
    // Reset uploaded image URL after successful creation
    setUploadedImageUrl("");
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

    // Format price to ensure it has exactly 2 decimal places
    const priceValue = parseFloat(formData.get("price") as string);
    const formattedPrice = priceValue.toFixed(2);

    updateProduct.mutate({
      id: editingProduct.id,
      data: {
        name,
        slug,
        description: formData.get("description") as string,
        price: formattedPrice,
        categoryId: formData.get("categoryId") as string,
        sku: formData.get("sku") as string,
        inventory: parseInt(formData.get("inventory") as string),
        images: uploadedImageUrl ? [uploadedImageUrl] : editingProduct.images ?? [],
        isFeatured: formData.get("isFeatured") === "on",
      },
    });
    
    // Reset uploaded image URL after successful update
    setUploadedImageUrl("");
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
        <h2 className="text-xl font-semibold text-white">
          Product Management
        </h2>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search products..."
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Create Product Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg bg-slate-700 p-4 border border-slate-600">
          <h3 className="mb-4 text-lg font-medium text-white">Create New Product</h3>
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
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories?.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>
            <div>
              <Label htmlFor="image">Product Image</Label>
              <div className="mt-2">
                <ImageUploadButton onUploadComplete={setUploadedImageUrl} />
                {uploadedImageUrl && (
                  <div className="mt-2">
                    <Image 
                      src={uploadedImageUrl} 
                      alt="Uploaded" 
                      className="h-32 w-32 object-cover rounded"
                      width={128}
                      height={128}
                    />
                    <p className="text-sm text-slate-400 mt-1">Image uploaded successfully!</p>
                  </div>
                )}
              </div>
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
        <div className="mb-6 rounded-lg bg-slate-700 p-4 border border-slate-600">
          <h3 className="mb-4 text-lg font-medium text-white">Edit Product</h3>
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
              <div>
                <Label htmlFor="edit-categoryId">Category</Label>
                <select
                  id="edit-categoryId"
                  name="categoryId"
                  defaultValue={""}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories?.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
              <Label htmlFor="edit-image">Product Image</Label>
              <div className="mt-2">
                <ImageUploadButton onUploadComplete={setUploadedImageUrl} />
                {uploadedImageUrl && (
                  <div className="mt-2">
                    <Image 
                      src={uploadedImageUrl} 
                      alt="Uploaded" 
                      className="h-32 w-32 object-cover rounded"
                      width={128}
                      height={128}
                    />
                    <p className="text-sm text-slate-400 mt-1">New image uploaded!</p>
                  </div>
                )}
                {!uploadedImageUrl && editingProduct.images?.[0] && (
                  <div className="mt-2">
                    <Image
                      src={editingProduct.images[0]} 
                      alt="Current" 
                      className="h-32 w-32 object-cover rounded"
                      width={128}
                      height={128}
                    />
                    <p className="text-sm text-slate-400 mt-1">Current image</p>
                  </div>
                )}
              </div>
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
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Inventory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Featured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600 bg-slate-800">
            {products
              ?.filter((p: Product) =>
                [p.name, p.sku ?? ""].some((v) =>
                  v.toLowerCase().includes(productSearch.toLowerCase()),
                ),
              )
              .map((product: Product) => (
              <tr key={product.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {product.name}
                    </div>
                    <div className="text-sm text-slate-400">{product.sku}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                  ${product.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                  {product.inventory}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      product.isFeatured
                        ? "bg-blue-900 text-blue-200"
                        : "bg-slate-600 text-slate-200"
                    }`}
                    onClick={() =>
                      updateProduct.mutate({
                        id: product.id,
                        data: { isFeatured: !product.isFeatured },
                      })
                    }
                  >
                    {product.isFeatured ? "Yes" : "No"}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {product.isFeatured ? (
                    <span className="inline-flex rounded-full bg-blue-900 px-2 py-1 text-xs font-semibold text-blue-200">
                      Featured
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-600 px-2 py-1 text-xs font-semibold text-slate-200">
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
