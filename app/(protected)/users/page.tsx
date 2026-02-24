"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usersAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { Users, ShieldCheck } from "lucide-react";

type UserRole = "admin" | "manager" | "cashier";

interface UserItem {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export default function UsersPage() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const { user } = useAuthStore();

  const [items, setItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getAll();
      setItems(response.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(language === "id" ? "Gagal memuat pengguna" : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canEditTarget = (target: UserItem) => {
    if (!user) return false;
    if (user.role === "manager") return target._id !== user.id;
    if (user.role === "admin") return target.role !== "manager";
    return false;
  };

  const getAllowedRoles = (target: UserItem): UserRole[] => {
    if (!user) return [target.role];

    if (user.role === "manager") {
      if (target._id === user.id) return ["manager"];
      return ["manager","admin", "cashier"];
    }

    if (user.role === "admin") {
      if (target.role === "manager") return ["manager"];
      return ["admin", "cashier"];
    }

    return [target.role];
  };

  const handleChangeRole = async (target: UserItem, nextRole: UserRole) => {
    if (nextRole === target.role) return;
    setIsSavingId(target._id);
    setError(null);
    try {
      await usersAPI.updateRole(target._id, nextRole);
      setItems((prev) =>
        prev.map((item) =>
          item._id === target._id ? { ...item, role: nextRole } : item
        )
      );
    } catch (err) {
      console.error("Failed to update role:", err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || null);
      } else {
        setError(tr("Failed to update role", "Gagal memperbarui role"));
      }
    } finally {
      setIsSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {tr("Users & Roles", "Pengguna & Role")}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {tr(
              "Manage account access and update user roles",
              "Kelola akses akun dan perbarui role pengguna"
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {tr("User List", "Daftar Pengguna")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">{tr("Loading...", "Memuat...")}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("No users found", "Pengguna tidak ditemukan")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-190">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tr("Username", "Username")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tr("Full Name", "Nama Lengkap")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tr("Role", "Role")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tr("Action", "Aksi")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-t border-border">
                      <td className="px-4 py-3 text-sm">{item.username}</td>
                      <td className="px-4 py-3 text-sm">{item.fullName || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item.email || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 capitalize">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <select
                            value={item.role}
                            disabled={!canEditTarget(item) || isSavingId === item._id}
                            onChange={(e) => handleChangeRole(item, e.target.value as UserRole)}
                            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground disabled:opacity-60"
                          >
                            {getAllowedRoles(item).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          {isSavingId === item._id && (
                            <span className="text-xs text-muted-foreground">
                              {tr("Saving...", "Menyimpan...")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              {tr("Refresh", "Muat Ulang")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
