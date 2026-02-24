"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { categoriesAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

export default function CategoriesPage() {
  const { language, t } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data?.data || []);
    } catch {
      setAlert({
        open: true,
        title: tr("Error", "Error"),
        message: tr("Failed to fetch categories.", "Gagal memuat kategori."),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
      await fetchCategories();
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
      await fetchCategories();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tr("Categories", "Kategori")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tr("Manage product categories", "Kelola kategori produk")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {tr("Add Category", "Tambah Kategori")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            {tr("Category List", "Daftar Kategori")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" className="h-14" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {tr("No categories found.", "Belum ada kategori.")}
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3"
                >
                  <span className="font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(cat._id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
        onClose={() => setIsModalOpen(false)}
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
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" className="flex-1">
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

