"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { purchasesAPI, suppliersAPI, productsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, Search, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";

interface Purchase {
  _id: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    buyPrice: number;
    subtotal: number;
  }[];
  supplierId: {
    _id: string;
    name: string;
    contact: string;
  };
  supplierName: string;
  totalAmount: number;
  createdAt: string;
}

interface PurchaseItem {
  productId: string;
  quantity: number;
  buyPrice: number;
}

function PurchasesContent() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ _id: string; name: string; stock: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [alertState, setAlertState] = useState<{
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

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await purchasesAPI.getAll({
        page,
        limit: 10,
      });
      const data = response.data.data;
      let purchasesData = data.purchases || data;

      // Client-side search filter
      if (searchTerm) {
        purchasesData = purchasesData.filter((p: Purchase) =>
          p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Client-side sort
      purchasesData.sort((a: Purchase, b: Purchase) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });

      setPurchases(purchasesData);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, sortOrder]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    const fetchSuppliersAndProducts = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          suppliersAPI.getAll(),
          productsAPI.getAll({ limit: 100 }),
        ]);
        setSuppliers(sRes.data.data || []);
        setProducts(pRes.data.data?.products || pRes.data.data || []);
      } catch (error) {
        console.error("Failed to load form data:", error);
      }
    };
    fetchSuppliersAndProducts();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortOrder]);

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { productId: "", quantity: 1, buyPrice: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseItem, value: unknown) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPurchaseItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      setAlertState({
        open: true,
        title: tr("Purchase", "Pembelian"),
        message: tr("Please select a supplier and add items.", "Pilih supplier dan tambahkan item."),
        variant: "warning",
      });
      return;
    }

    const items = purchaseItems.filter(
      (item) => item.productId && item.quantity >= 1 && item.buyPrice >= 0
    );
    if (items.length === 0) {
      setAlertState({
        open: true,
        title: tr("Purchase", "Pembelian"),
        message: tr("Please add at least one valid item.", "Tambahkan minimal satu item valid."),
        variant: "warning",
      });
      return;
    }

    try {
      await purchasesAPI.create({
        supplierId: selectedSupplier,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
        })),
      });

      setAlertState({
        open: true,
        title: t.common.success,
        message: tr("Purchase completed successfully.", "Pembelian berhasil diselesaikan."),
        variant: "success",
      });
      setIsCreateModalOpen(false);
      setPurchaseItems([]);
      setSelectedSupplier("");
      fetchPurchases();
    } catch (error: unknown) {
      console.error("Purchase error:", error);
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (
            error as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          ).response?.data?.message ||
          (error as { message?: string }).message ||
          tr("Failed to process purchase", "Gagal memproses pembelian")
          : error instanceof Error
            ? error.message
            : tr("Failed to process purchase", "Gagal memproses pembelian");
      setAlertState({
        open: true,
        title: tr("Purchase Failed", "Pembelian Gagal"),
        message,
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await purchasesAPI.delete(deleteId);
      setDeleteId(null);
      fetchPurchases();
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      setAlertState({
        open: true,
        title: tr("Delete Failed", "Hapus Gagal"),
        message: tr("Failed to delete purchase.", "Gagal menghapus pembelian."),
        variant: "error",
      });
    }
  };

  const totalAmount = purchaseItems.reduce(
    (sum, item) => sum + item.quantity * item.buyPrice,
    0
  );

  const hasValidItems = purchaseItems.some((item) => item.productId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.purchases.title}</h1>
          <p className="text-muted-foreground mt-1">
            {tr("Track restock purchases from suppliers", "Lacak pembelian restock dari supplier")}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {tr("New Purchase", "Pembelian Baru")}
        </Button>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={tr("Search by supplier name...", "Cari nama supplier...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-2"
        >
          {sortOrder === "desc" ? (
            <>
              <ArrowDown className="h-4 w-4" />
              {tr("Newest First", "Terbaru")}
            </>
          ) : (
            <>
              <ArrowUp className="h-4 w-4" />
              {tr("Oldest First", "Terlama")}
            </>
          )}
        </Button>
      </div>

      {/* Purchases List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" className="h-24" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? tr(`No purchases found for "${searchTerm}"`, `Pembelian "${searchTerm}" tidak ditemukan`)
                : tr("No purchases found. Create your first purchase!", "Belum ada pembelian. Buat pembelian pertama Anda!")}
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase._id}
                  className="p-4 bg-muted rounded-xl border border-border"
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {purchase.supplierId?.name || purchase.supplierName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(purchase.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(purchase.totalAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.items.length} {tr("items", "item")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(purchase._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {purchase.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {tr("Page", "Halaman")} {page} {tr("of", "dari")} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t.common.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  {t.common.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Purchase Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPurchaseItems([]);
          setSelectedSupplier("");
        }}
        title={tr("New Purchase", "Pembelian Baru")}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t.purchases.supplier}
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t.suppliers.selectSupplier}</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t.purchases.items}</h4>
              <Button type="button" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                {tr("Add Item", "Tambah Item")}
              </Button>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 -mx-1 custom-scrollbar">
              {purchaseItems.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-muted/40 sm:bg-transparent rounded-xl border sm:border-0 border-border">
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleUpdateItem(index, "productId", e.target.value)
                    }
                    className="flex-1 w-full px-4 py-2 bg-card border border-input rounded-xl text-foreground text-sm h-11"
                  >
                    <option value="">{tr("Select Product", "Pilih Produk")}</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({t.products.stock}: {p.stock})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                      type="number"
                      placeholder={tr("Qty", "Jml")}
                      min={1}
                      step={1}
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleUpdateItem(index, "quantity", Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 sm:w-20"
                    />
                    <Input
                      type="number"
                      placeholder={tr("Price", "Harga")}
                      min={0}
                      step="any"
                      value={item.buyPrice || ""}
                      onChange={(e) =>
                        handleUpdateItem(index, "buyPrice", Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 sm:w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {purchaseItems.length > 0 && (
            <div className="p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium">{tr("Total Amount", "Total Biaya")}</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsCreateModalOpen(false);
                setPurchaseItems([]);
                setSelectedSupplier("");
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedSupplier || !hasValidItems}
            >
              {tr("Complete Purchase", "Selesaikan Pembelian")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={tr("Delete Purchase", "Hapus Pembelian")}
        message={tr(
          "Are you sure you want to delete this purchase record? This action cannot be undone.",
          "Apakah Anda yakin ingin menghapus data pembelian ini? Tindakan ini tidak dapat dibatalkan."
        )}
        variant="danger"
      />
      <AlertModal
        isOpen={alertState.open}
        onClose={() => setAlertState((prev) => ({ ...prev, open: false }))}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />
    </div>
  );
}

function PurchaseCardSkeleton() {
  return (
    <div className="p-4 bg-muted rounded-xl border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-5 w-32" />
          <Skeleton variant="rectangular" className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-1">
            <Skeleton variant="rectangular" className="h-6 w-24" />
            <Skeleton variant="rectangular" className="h-4 w-12 ml-auto" />
          </div>
          <Skeleton variant="rectangular" className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="rectangular" className="h-4 w-full" />
        <Skeleton variant="rectangular" className="h-4 w-full" />
      </div>
    </div>
  );
}

function PurchasesSkeleton({ t }: { t: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <Skeleton variant="rectangular" className="h-5 w-64" />
        </div>
        <Skeleton variant="rectangular" className="h-10 w-36" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton variant="rectangular" className="h-10 flex-1 min-w-[200px]" />
        <Skeleton variant="rectangular" className="h-10 w-32" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PurchaseCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PurchasesPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<PurchasesSkeleton t={t} />}>
      <PurchasesContent />
    </Suspense>
  );
}
