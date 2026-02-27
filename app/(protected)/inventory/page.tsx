"use client";

import React, { useCallback, useEffect, useState, Suspense, useMemo } from "react";
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
import { usePageData } from "@/lib/usePageData";
import { useDataRefresh, triggerDataRefresh } from "@/lib/useDataRefresh";
import { formatDate, cn } from "@/lib/utils";

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
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    unit: "pcs",
    categoryId: "",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page, limit: 10 };
    if (searchTerm) p.search = searchTerm;
    if (selectedCategory) p.categoryId = selectedCategory;
    return p;
  }, [page, searchTerm, selectedCategory]);

  const { data: productsData, isLoading, isRefreshing, refetch: refetchProducts } = usePageData<{ products: InventoryItem[]; pagination: { total: number } }>({
    key: "inventory-products",
    fetchFn: async () => {
      const response = await productsAPI.getAll(params);
      return response.data.data;
    },
    params,
  });

  // Listen for refresh events and auto-refetch inventory data
  useDataRefresh(['inventory', 'products', 'purchases', 'all'], useCallback(() => {
    refetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const products = productsData?.products || [];
  const totalItems = productsData?.pagination?.total || 0;

  const { data: categories } = usePageData<{ _id: string; name: string }[]>({
    key: "categories",
    fetchFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data.data;
    },
  });

  const { data: historyData } = usePageData<{ history: HistoryItem[]; pagination: { total: number } }>({
    key: "inventory-history",
    fetchFn: async () => {
      const response = await reportsAPI.getHistory({ page: historyPage, limit: 10 });
      return response.data.data;
    },
    params: { page: historyPage, limit: 10 },
  });

  const history = historyData?.history || [];
  const totalHistory = historyData?.pagination?.total || 0;

  const handleOpenModal = (product?: InventoryItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        unit: (product as any).unit || "pcs",
        categoryId: product.categoryId?._id || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        stock: "0",
        unit: "pcs",
        categoryId: categories?.[0]?._id || "",
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
        unit: formData.unit as 'pcs' | 'box' | 'kg' | 'liter' | 'pack' | 'bottle' | 'can' | 'sachet' | 'cup' | 'tube',
        categoryId: formData.categoryId,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, data);
      } else {
        await productsAPI.create(data);
      }

      setIsProductModalOpen(false);
      refetchProducts(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('products');
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      setDeleteId(null);
      refetchProducts(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('products');
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  if (isLoading && !productsData) {
    return <InventorySkeleton />;
  }

  return (
    <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.inventory.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
              className="w-full sm:w-auto px-3 py-2 bg-card border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:min-w-40"
            >
              <option value="">{tr("All Categories", "Semua Kategori")}</option>
              {categories?.map((cat) => (
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
        isLoading={isRefreshing}
        totalItems={totalItems}
        page={page}
        onPageChange={setPage}
        hideSearch={true}
        showUnit={true}
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Product Information", "Informasi Produk")}</h3>
            <Input label={t.products.name} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Pricing & Stock", "Harga & Stok")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label={tr("Price", "Harga")} type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Math.max(0, parseInt(e.target.value) || 0).toString() })} required />
              <Input label={t.products.stock} type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value) || 0).toString() })} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Details", "Detail")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">{t.products.unit}</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent focus:ring-offset-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-150"
                  )}
                >
                  <option value="pcs">{t.units.pcs}</option>
                  <option value="box">{t.units.box}</option>
                  <option value="kg">{t.units.kg}</option>
                  <option value="liter">{t.units.liter}</option>
                  <option value="pack">{t.units.pack}</option>
                  <option value="bottle">{t.units.bottle}</option>
                  <option value="can">{t.units.can}</option>
                  <option value="sachet">{t.units.sachet}</option>
                  <option value="cup">Cup</option>
                  <option value="tube">Tube</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">{t.products.category}</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent focus:ring-offset-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-150"
                  )}
                  required
                >
                  <option value="">{t.products.selectCategory}</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-border">
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

function InventorySkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
        </div>
        <Skeleton variant="rectangular" className="h-9 sm:h-10 w-32 sm:w-40 rounded-lg" />
      </div>

      {/* Search & Category Filter */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Skeleton variant="rectangular" className="h-9 sm:h-10 flex-1 min-w-50 rounded-lg" />
            <Skeleton variant="rectangular" className="h-9 sm:h-10 w-full sm:w-48 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 sm:py-4 border-b border-border/50">
          <Skeleton variant="rectangular" className="h-5 sm:h-6 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 last:border-0">
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rectangular" className="h-4 sm:h-5 w-40 sm:w-48" />
                  <Skeleton variant="rectangular" className="h-3 sm:h-4 w-20 sm:w-24" />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <Skeleton variant="rectangular" className="h-7 w-14 sm:h-8 sm:w-16 rounded" />
                  <Skeleton variant="rectangular" className="h-7 w-14 sm:h-8 sm:w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryContent />
    </Suspense>
  );
}
