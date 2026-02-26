"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Search, Plus, Grid, List, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ViewMode = "grid" | "list";

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products);
      setTotalItems(response.data.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

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
        categoryId: categories[0]?._id || "",
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
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  }, [editingProduct, fetchProducts, formData]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }, [deleteId, fetchProducts]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile first stacked layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.products.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {tr("Manage your product catalog", "Kelola katalog produk Anda")}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/checkout" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <ShoppingCart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{tr("Go to Checkout", "Ke Checkout")}</span>
              <span className="sm:hidden">Checkout</span>
            </Button>
          </Link>
          <Button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none">
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
              {categories.map((cat) => (
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
      {isLoading ? (
        <div className={cn(viewMode === "grid" ? "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "")}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-64 sm:h-72" />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productGrid}
        </div>
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

        {/* Product Modal */}
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? t.products.editProduct : t.products.addProduct}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.products.unit}
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label={t.products.costPrice}
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
              />
              <Input
                label={t.products.sellingPrice}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
              <Input
                label={t.products.stock}
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t.products.minStock}
                type="number"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.products.category}
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">{t.products.selectCategory}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label={tr("Image URL (optional)", "URL Gambar (opsional)")}
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
            />
            <div className="flex gap-2 pt-4">
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


