"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { usersAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { Users, ShieldCheck, RefreshCw } from "lucide-react";

type UserRole = "admin" | "manager" | "cashier";

interface UserItem {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

function UsersContent() {
  const { language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const { user } = useAuthStore();

  const [items, setItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const response = await usersAPI.getAll();
      setItems(response.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(language === "id" ? "Gagal memuat pengguna" : "Failed to load users");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    fetchUsers(items.length === 0);
  }, [fetchUsers]);

  const canEditTarget = (target: UserItem) => {
    if (!user) return false;
    // Admins can manage anyone except managers (if defined that way)
    // Managers can manage everyone except themselves
    if (user.role === "manager") return target._id !== user.id;
    if (user.role === "admin") return target.role !== "manager";
    return false;
  };

  const getAllowedRoles = (target: UserItem): UserRole[] => {
    if (!user) return [target.role];
    if (user.role === "manager") {
      if (target._id === user.id) return ["manager"];
      return ["manager", "admin", "cashier"];
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
      setError(tr("Failed to update role", "Gagal memperbarui role"));
    } finally {
      setIsSavingId(null);
    }
  };

  if (isLoading && items.length === 0) {
    return <UsersSkeleton tr={tr} />;
  }

  return (
    <div className={`space-y-4 sm:space-y-6 transition-all duration-300 ${isRefreshing ? 'opacity-60 grayscale-[0.2]' : 'opacity-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {tr("Users & Roles", "Pengguna & Role")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {tr(
              "Manage account access and update user roles",
              "Kelola akses akun dan perbarui role pengguna"
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchUsers(false)} disabled={isRefreshing} className="shadow-sm h-8 sm:h-9 sm:h-10">
          <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{tr("Refresh", "Segarkan")}</span>
          <span className="sm:hidden">{tr("Refresh", "Segarkan")}</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {tr("User List", "Daftar Pengguna")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {error && (
            <div className="mb-3 sm:mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground py-8 sm:py-10 text-center italic">{tr("No users found", "Pengguna tidak ditemukan")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
              <table className="w-full min-w-[500px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                      {tr("Username", "Username")}
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                      {tr("Full Name", "Nama Lengkap")}
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                      Role
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                      {tr("Action", "Aksi")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium">{item.username}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{item.fullName || "-"}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold capitalize text-primary">
                          <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {item.role}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <select
                            value={item.role}
                            disabled={!canEditTarget(item) || isSavingId === item._id}
                            onChange={(e) => handleChangeRole(item, e.target.value as UserRole)}
                            className="rounded-lg border border-input bg-background px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-40"
                          >
                            {getAllowedRoles(item).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          {isSavingId === item._id && (
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground animate-pulse font-mono whitespace-nowrap">
                              SAVING...
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
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSkeleton({ tr }: { tr: any }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
        <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
      </div>
      <Card>
        <CardHeader className="py-3 sm:py-4"><Skeleton variant="rectangular" className="h-5 sm:h-6 w-28 sm:w-32" /></CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2.5 sm:space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} variant="rectangular" className="h-10 sm:h-12 w-full" />))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  return (
    <Suspense fallback={<UsersSkeleton tr={tr} />}>
      <UsersContent />
    </Suspense>
  );
}
