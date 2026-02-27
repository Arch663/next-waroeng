"use client";

import React, { useCallback, useState, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { categoriesAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { usePageData } from "@/lib/usePageData";
import { useDataRefresh, triggerDataRefresh } from "@/lib/useDataRefresh";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

function CategoriesContent() {
  const { language, t } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [alert, setAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "warning" | "error" | "info";
  }>({
    open: false,
    title: tr("Notification", "Notifikasi"),
    message: "",
    variant: "info",
  });

  const { data: categories, isLoading, isRefreshing, refetch } = usePageData<Category[]>({
    key: "categories",
    fetchFn: async () => {
      const res = await categoriesAPI.getAll();
      return res.data?.data || [];
    },
  });

  // Listen for refresh events and auto-refetch categories data
  useDataRefresh(['categories', 'products', 'inventory', 'all'], useCallback(() => {
    refetch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setIsModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, { name: name.trim() });
      } else {
        await categoriesAPI.create({ name: name.trim() });
      }
      setIsModalOpen(false);
      setName("");
      refetch(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('categories');
      setAlert({
        open: true,
        title: t.common.success,
        message: editingCategory
          ? tr("Category updated successfully.", "Kategori berhasil diperbarui.")
          : tr("Category created successfully.", "Kategori berhasil dibuat."),
        variant: "success",
      });
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message!
          : tr("Failed to save category.", "Gagal menyimpan kategori.");
      setAlert({
        open: true,
        title: tr("Error", "Error"),
        message,
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoriesAPI.delete(deleteId);
      setDeleteId(null);
      refetch(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('categories');
      setAlert({
        open: true,
        title: t.common.success,
        message: tr("Category deleted successfully.", "Kategori berhasil dihapus."),
        variant: "success",
      });
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message!
          : tr("Failed to delete category.", "Gagal menghapus kategori.");
      setAlert({
        open: true,
        title: tr("Error", "Error"),
        message,
        variant: "error",
      });
    }
  };

  if (isLoading && (!categories || categories.length === 0)) {
    return <CategoriesSkeleton />;
  }

  return (
    <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{tr("Categories", "Kategori")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tr("Manage product categories", "Kelola kategori produk")}
          </p>
        </div>
        <Button onClick={openCreate} disabled={isLoading} className="h-9 sm:h-10">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{tr("Add Category", "Tambah Kategori")}</span>
          <span className="sm:hidden">{tr("Add", "Tambah")}</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Tags className="h-4 w-4 sm:h-5 sm:w-5" />
            {tr("Category List", "Daftar Kategori")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {!categories || categories.length === 0 ? (
            <div className="text-center py-8 sm:py-10 text-muted-foreground">
              {tr("No categories found.", "Belum ada kategori.")}
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 sm:px-4 py-2.5 sm:py-3"
                >
                  <span className="font-medium text-sm sm:text-base">{cat.name}</span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(cat)} disabled={isLoading} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
                      onClick={() => setDeleteId(cat._id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title={editingCategory ? tr("Edit Category", "Edit Kategori") : tr("Add Category", "Tambah Kategori")}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={tr("Category Name", "Nama Kategori")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-9 sm:h-10" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" className="flex-1 h-9 sm:h-10">
              {editingCategory ? t.common.save : t.common.add}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={tr("Delete Category", "Hapus Kategori")}
        message={tr(
          "Are you sure you want to delete this category? This action cannot be undone.",
          "Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        )}
        variant="danger"
      />

      <AlertModal
        isOpen={alert.open}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
      />
    </div>
  );
}

export default function CategoriesPage() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </Suspense>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
        </div>
        <Skeleton variant="rectangular" className="h-9 sm:h-10 w-32 sm:w-36 rounded-lg" />
      </div>
      {/* Card */}
      <Card>
        <CardHeader className="py-3 sm:py-4">
          <Skeleton variant="rectangular" className="h-5 sm:h-6 w-28 sm:w-32" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2.5 sm:space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-12 sm:h-14 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

