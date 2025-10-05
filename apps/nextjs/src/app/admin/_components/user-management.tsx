"use client";

import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { authClient } from "~/auth/client";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 100,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (error) {
        setError(error.message ?? "Failed to load users");
      } else {
        setUsers(data.users as User[]);
      }
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await authClient.admin.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as "user" | "admin",
      });

      if (error) {
        setError(error.message ?? "Failed to create user");
      } else {
        setShowCreateForm(false);
        setNewUser({ name: "", email: "", password: "", role: "user" });
        void loadUsers();
      }
    } catch {
      setError("Failed to create user");
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    try {
      const { error } = await authClient.admin.setRole({
        userId,
        role: role as "user" | "admin",
      });

      if (error) {
        setError(error.message ?? "Failed to update user role");
      } else {
        void loadUsers();
      }
    } catch {
      setError("Failed to update user role");
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const { error } = await authClient.admin.banUser({
        userId,
        banReason: reason,
      });

      if (error) {
        setError(error.message ?? "Failed to ban user");
      } else {
        void loadUsers();
      }
    } catch {
      setError("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await authClient.admin.unbanUser({
        userId,
      });

      if (error) {
        setError(error.message ?? "Failed to unban user");
      } else {
        void loadUsers();
      }
    } catch {
      setError("Failed to unban user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
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
      {error && (
        <div className="mb-4 rounded-md border border-red-600 bg-red-900/40 p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create User"}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg border border-slate-600 bg-slate-800 p-4">
          <h3 className="mb-4 text-lg font-medium text-white">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit">Create User</Button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600 bg-slate-800">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-slate-400">{user.email}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleSetRole(user.id, e.target.value)}
                    className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.banned ? (
                    <span className="inline-flex rounded-full bg-red-900 px-2 py-1 text-xs font-semibold text-red-200">
                      Banned
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-900 px-2 py-1 text-xs font-semibold text-green-200">
                      Active
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {user.banned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnbanUser(user.id)}
                    >
                      Unban
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Ban reason:");
                        if (reason) void handleBanUser(user.id, reason);
                      }}
                    >
                      Ban
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-8 text-center text-gray-500">No users found</div>
      )}
    </div>
  );
}
