"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { InventoryTable, type InventoryItem } from "@/components/ui/InventoryTable";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { productsAPI, reportsAPI, categoriesAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatDate } from "@/lib/utils";

interface HistoryItem {
  _id: string;
  productId: string;
  productName: string;
  type: "sold" | "bought" | "adjusted";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
  notes?: string;
}

function InventoryContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalHistory, setTotalHistory] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const params: { page: number; limit: number; search?: string; categoryId?: string } = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;
      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products || []);
      setTotalItems(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await reportsAPI.getHistory({ page: historyPage, limit: 10 });
      setHistory(response.data.data.history || []);
      setTotalHistory(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, [historyPage]);

  useEffect(() => {
    fetchProducts(products.length === 0);
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenModal = (product?: InventoryItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId?._id || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        stock: "0",
        categoryId: categories[0]?._id || "",
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, data);
      } else {
        await productsAPI.create(data);
      }

      setIsProductModalOpen(false);
      fetchProducts(false);
      fetchHistory();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      setDeleteId(null);
      fetchProducts(false);
      fetchHistory();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  if (isLoading && products.length === 0) {
    return <InventorySkeleton tr={tr} t={t} />;
  }

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.inventory.title}</h1>
          <p className="text-muted-foreground mt-1">
            {tr("Manage product stock and view history", "Kelola stok produk dan lihat riwayat")}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          {t.products.addProduct}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-full sm:flex-1 sm:min-w-64">
              <Input
                placeholder={t.cashier.searchProduct}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{tr("All Categories", "Semua Kategori")}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <InventoryTable
        items={products}
        onEdit={handleOpenModal}
        onDelete={(id) => setDeleteId(id)}
        isLoading={isRefreshing && products.length > 0}
        totalItems={totalItems}
        page={page}
        onPageChange={setPage}
        hideSearch={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>{tr("Stock Movement History", "Riwayat Pergerakan Stok")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{tr("Product", "Produk")}</th>
                  <th className="px-4 py-3 text-left font-medium">{tr("Type", "Tipe")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t.cashier.quantity}</th>
                  <th className="px-4 py-3 text-right font-medium">{tr("Stock Before", "Stok Sebelum")}</th>
                  <th className="px-4 py-3 text-right font-medium">{tr("Stock After", "Stok Sesudah")}</th>
                  <th className="px-4 py-3 text-left font-medium">{tr("Date", "Tanggal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground italic">
                      {tr("No history found", "Riwayat tidak ditemukan")}
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.productName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${item.type === 'sold' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          item.type === 'bought' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.stockBefore}</td>
                      <td className="px-4 py-3 text-right font-semibold">{item.stockAfter}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {Math.ceil(totalHistory / 10) > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {tr("Page", "Halaman")} {historyPage} {tr("of", "dari")} {Math.ceil(totalHistory / 10)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                >
                  {t.common.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={historyPage >= Math.ceil(totalHistory / 10)}
                >
                  {t.common.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? t.products.editProduct : t.products.addProduct}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t.products.name} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={tr("Price", "Harga")} type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            <Input label={t.products.stock} type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.products.category}</label>
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required>
              <option value="">{t.products.selectCategory}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsProductModalOpen(false)}>{t.common.cancel}</Button>
            <Button type="submit" className="flex-1">{editingProduct ? t.common.edit : t.common.add}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t.products.deleteProduct}
        message={tr("Are you sure you want to delete this product? This action cannot be undone.", "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.")}
        variant="danger"
      />
    </div>
  );
}

function InventorySkeleton({ tr, t }: { tr: any; t: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-10 w-64" />
          <Skeleton variant="rectangular" className="h-4 w-80" />
        </div>
        <Skeleton variant="rectangular" className="h-10 w-40" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Skeleton variant="rectangular" className="h-11 flex-1 min-w-[260px]" />
            <Skeleton variant="rectangular" className="h-11 w-full sm:w-48" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-4 border-b border-border/50">
          <Skeleton variant="rectangular" className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0">
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rectangular" className="h-5 w-48" />
                  <Skeleton variant="rectangular" className="h-3 w-24" />
                </div>
                <div className="flex gap-4">
                  <Skeleton variant="rectangular" className="h-8 w-16" />
                  <Skeleton variant="rectangular" className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Skeleton variant="rectangular" className="h-6 w-56" /></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  return (
    <Suspense fallback={<InventorySkeleton tr={tr} t={t} />}>
      <InventoryContent />
    </Suspense>
  );
}
