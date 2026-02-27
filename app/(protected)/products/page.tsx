"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import { InventoryTable, type InventoryItem } from "@/components/ui/InventoryTable";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { productsAPI, categoriesAPI } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { useLanguage } from "@/lib/LanguageContext";
import { usePageData } from "@/lib/usePageData";
import { usePageCache } from "@/lib/usePageCache";
import { useDataRefresh, triggerDataRefresh } from "@/lib/useDataRefresh";
import { Search, Plus, Grid, List, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ViewMode = "grid" | "list";

function ProductsContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    costPrice: "",
    price: "",
    stock: "",
    unit: "pcs",
    minStock: "5",
    categoryId: "",
    image: "",
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState("1");

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const invalidateCache = usePageCache((state) => state.invalidateCache);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page, limit: 20 };
    if (searchTerm) p.search = searchTerm;
    if (selectedCategory) p.categoryId = selectedCategory;
    return p;
  }, [page, searchTerm, selectedCategory]);

  const { data: productsData, isLoading, isRefreshing, refetch } = usePageData<{ products: Product[]; pagination: { total: number } }>({
    key: "products",
    fetchFn: async () => {
      const response = await productsAPI.getAll(params);
      return response.data.data;
    },
    params,
  });

  // Listen for refresh events and auto-refetch products data
  useDataRefresh(['products', 'inventory', 'checkout', 'all'], useCallback(() => {
    invalidateCache("products");
    refetch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const products = productsData?.products || [];
  const totalItems = productsData?.pagination?.total || 0;

  const { data: categories, refetch: refetchCategories } = usePageData<{ _id: string; name: string }[]>({
    key: "categories",
    fetchFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data.data;
    },
  });

  const handleOpenModal = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || "",
        costPrice: (product as unknown as { costPrice?: number }).costPrice?.toString() || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        unit: (product as unknown as { unit?: string }).unit || "pcs",
        minStock: (product as unknown as { minStock?: number }).minStock?.toString() || "5",
        categoryId: product.categoryId._id,
        image: product.image || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        costPrice: "",
        price: "",
        stock: "0",
        unit: "pcs",
        minStock: "5",
        categoryId: categories?.[0]?._id || "",
        image: "",
      });
    }
    setIsProductModalOpen(true);
  }, [categories]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        unit: formData.unit as 'pcs' | 'box' | 'kg' | 'liter' | 'pack' | 'bottle' | 'can' | 'sachet' | 'cup',
        minStock: parseInt(formData.minStock) || 5,
        categoryId: formData.categoryId,
        image: formData.image,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, data);
      } else {
        await productsAPI.create(data);
      }

      setIsProductModalOpen(false);
      invalidateCache("products");
      refetch(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('products');
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  }, [editingProduct, formData, invalidateCache, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      setDeleteId(null);
      invalidateCache("products");
      refetch(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('products');
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }, [deleteId, invalidateCache, refetch]);

  const handleAddToCart = useCallback((product: Product) => {
    setSelectedProductForCart(product);
    setSelectedQty("1");
    setIsQtyModalOpen(true);
  }, []);

  const handleConfirmAddToCart = useCallback(() => {
    if (!selectedProductForCart) return;
    const qty = Math.max(1, Math.min(Number(selectedQty) || 1, selectedProductForCart.stock));
    const existingItem = items.find((item) => item.productId === selectedProductForCart._id);

    if (existingItem) {
      const nextQty = Math.min(existingItem.quantity + qty, selectedProductForCart.stock);
      updateQuantity(selectedProductForCart._id, nextQty);
    } else {
      addItem(selectedProductForCart);
      if (qty > 1) {
        updateQuantity(selectedProductForCart._id, qty);
      }
    }

    setIsQtyModalOpen(false);
    setSelectedProductForCart(null);
    setSelectedQty("1");
  }, [addItem, items, selectedProductForCart, selectedQty, updateQuantity]);

  const productGrid = useMemo(
    () =>
      products.map((product) => (
        <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
      )),
    [products, handleAddToCart]
  );

  // Show skeleton on initial load
  if (isLoading && !productsData) {
    return <ProductsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.products.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tr("Manage your product catalog", "Kelola katalog produk Anda")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/checkout">
            <Button variant="outline" className="h-9 sm:h-10">
              <ShoppingCart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{tr("Go to Checkout", "Ke Checkout")}</span>
              <span className="sm:hidden">Checkout</span>
            </Button>
          </Link>
          <Button onClick={() => handleOpenModal()} className="h-9 sm:h-10">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.products.addProduct}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters - Responsive layout */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <Input
                placeholder={t.cashier.searchProduct}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-card border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:min-w-40"
            >
              <option value="">{tr("All Categories", "Semua Kategori")}</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex-1 sm:flex-none px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex-1 sm:flex-none px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Display */}
      <div className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
        {isLoading && products.length === 0 ? (
          <div className={cn(viewMode === "grid" ? "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-64 sm:h-72" />
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productGrid}
            </div>
            {/* Pagination for Grid View */}
            {totalItems > 20 && (
              <div className="px-3 sm:px-4 py-3 border-t border-border flex items-center justify-between gap-3 mt-4">
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  {tr("Halaman", "Page")} {page} {tr("dari", "of")} {Math.ceil(totalItems / 20)}
                </p>
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 sm:h-9 w-8 sm:w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(Math.ceil(totalItems / 20), p + 1))}
                    disabled={page === Math.ceil(totalItems / 20)}
                    className="h-8 sm:h-9 w-8 sm:w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <InventoryTable
            items={products as unknown as InventoryItem[]}
            onEdit={handleOpenModal}
            onDelete={(id) => setDeleteId(id)}
            totalItems={totalItems}
            page={page}
            onPageChange={setPage}
            onSearch={setSearchTerm}
            hideSearch={true}
          />
        )}
      </div>

        {/* Product Modal */}
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? t.products.editProduct : t.products.addProduct}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Product Information", "Informasi Produk")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label={t.products.name}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <Input
                  label={t.products.sku}
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder={tr("Auto-generated if empty", "Otomatis jika kosong")}
                />
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                    {t.products.unit}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
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
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Pricing & Stock", "Harga & Stok")}</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={t.products.costPrice}
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: Math.max(0, parseInt(e.target.value) || 0).toString() })
                  }
                />
                <Input
                  label={t.products.sellingPrice}
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Math.max(0, parseInt(e.target.value) || 0).toString() })
                  }
                  required
                />
                <Input
                  label={t.products.stock}
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value) || 0).toString() })
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">{tr("Settings", "Pengaturan")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t.products.minStock}
                  type="number"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: Math.max(0, parseInt(e.target.value) || 0).toString() })
                  }
                />
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                    {t.products.category}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
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
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Input
              label={tr("Image URL (optional)", "URL Gambar (opsional)")}
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
            />

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsProductModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1">
                {editingProduct ? t.common.edit : t.common.add}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={t.products.deleteProduct}
          message={tr(
            "Are you sure you want to delete this product? This action cannot be undone.",
            "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
          )}
          variant="danger"
        />

        <Modal
          isOpen={isQtyModalOpen}
          onClose={() => {
            setIsQtyModalOpen(false);
            setSelectedProductForCart(null);
          }}
          title={tr("Add Quantity", "Tambah Jumlah")}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted">
              <p className="font-medium">{selectedProductForCart?.name}</p>
              <p className="text-sm text-muted-foreground">
                {tr("Stock available", "Stok tersedia")}: {selectedProductForCart?.stock || 0}
              </p>
            </div>
            <Input
              label={t.cashier.quantity}
              type="number"
              min={1}
              max={selectedProductForCart?.stock || 1}
              value={selectedQty}
              onChange={(e) => setSelectedQty(e.target.value)}
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsQtyModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button type="button" className="flex-1" onClick={handleConfirmAddToCart}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton variant="rectangular" className="h-9 sm:h-10 flex-1 sm:flex-none w-full sm:w-32 rounded-lg" />
          <Skeleton variant="rectangular" className="h-9 sm:h-10 flex-1 sm:flex-none w-full sm:w-32 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton variant="rectangular" className="h-10 flex-1 rounded-lg" />
            <Skeleton variant="rectangular" className="h-10 w-full sm:w-48 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton variant="rectangular" className="h-10 w-10 rounded-lg" />
              <Skeleton variant="rectangular" className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-64 sm:h-72" />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}