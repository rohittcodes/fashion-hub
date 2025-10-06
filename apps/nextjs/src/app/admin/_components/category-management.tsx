"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RouterInputs } from "@acme/api";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import { useTRPC } from "~/trpc/react";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
}

export function CategoryManagement() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery(
    trpc.category.all.queryOptions({ includeInactive: true }),
  );

  const createCategory = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: () => {
        setShowCreateForm(false);
        void queryClient.invalidateQueries(trpc.category.all.queryFilter());
      },
    }),
  );

  const updateCategory = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: () => {
        setEditing(null);
        void queryClient.invalidateQueries(trpc.category.all.queryFilter());
      },
    }),
  );

  const deleteCategory = useMutation(
    trpc.category.delete.mutationOptions({
      onSuccess: () =>
        void queryClient.invalidateQueries(trpc.category.all.queryFilter()),
    }),
  );

  const toggleActive = useMutation(
    trpc.category.toggleActive.mutationOptions({
      onSuccess: () =>
        void queryClient.invalidateQueries(trpc.category.all.queryFilter()),
    }),
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const desc = form.get("description");
    const payload: RouterInputs["category"]["create"] = {
      name,
      slug,
      description: typeof desc === "string" ? desc : undefined,
      // omit image if none; API expects string URL when provided
    };
    createCategory.mutate(payload);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const desc = form.get("description");
    const payload: RouterInputs["category"]["update"] = {
      id: editing.id,
      data: {
        name,
        slug,
        description: typeof desc === "string" ? desc : undefined,
      },
    };
    updateCategory.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-slate-600"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-slate-600"></div>
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
          Category Management
        </h2>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search categories..."
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create Category"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6 rounded-lg border border-slate-600 bg-slate-700 p-4">
          <h3 className="mb-4 text-lg font-medium text-white">
            Create New Category
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
            </div>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Creating..." : "Create Category"}
            </Button>
          </form>
        </div>
      )}

      {editing && (
        <div className="mb-6 rounded-lg border border-slate-600 bg-slate-700 p-4">
          <h3 className="mb-4 text-lg font-medium text-white">Edit Category</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editing.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  rows={2}
                  defaultValue={editing.description ?? ""}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateCategory.isPending}>
                {updateCategory.isPending ? "Updating..." : "Update Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Slug
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
            {categories
              ?.filter((c: CategoryRow) =>
                [c.name, c.slug, c.description ?? ""].some((v) =>
                  v.toLowerCase().includes(search.toLowerCase()),
                ),
              )
              .map((c: CategoryRow) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {c.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {c.description}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                    {c.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        c.isActive
                          ? "bg-green-900 text-green-200"
                          : "bg-slate-600 text-slate-200"
                      }`}
                      onClick={() => toggleActive.mutate(c.id)}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this category? This cannot be undone.",
                            )
                          ) {
                            deleteCategory.mutate(c.id);
                          }
                        }}
                        disabled={deleteCategory.isPending}
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
    </div>
  );
}
