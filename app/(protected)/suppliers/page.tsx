"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertModal } from "@/components/ui/AlertModal";
import { suppliersAPI, purchasesAPI, productsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { usePageData } from "@/lib/usePageData";
import { useDataRefresh, triggerDataRefresh } from "@/lib/useDataRefresh";
import { formatCurrency } from "@/lib/utils";
import { Plus, ArrowUpDown, Search, Phone, MapPin, Truck } from "lucide-react";

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  address: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface PurchaseItem {
  productId: string;
  quantity: number;
  buyPrice: number;
}

function SuppliersContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);

  const { data: suppliersData, isLoading: isLoadingSuppliers, isRefreshing: isRefreshingSuppliers, refetch: refetchSuppliers } = usePageData<Supplier[]>({
    key: "suppliers",
    fetchFn: async () => {
      const response = await suppliersAPI.getAll();
      return response.data.data || [];
    },
  });

  // Listen for refresh events and auto-refetch suppliers data
  useDataRefresh(['suppliers', 'purchases', 'all'], useCallback(() => {
    refetchSuppliers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const { data: productsData } = usePageData<Product[]>({
    key: "suppliers-products",
    fetchFn: async () => {
      const response = await productsAPI.getAll({ limit: 100 });
      return response.data.data?.products || response.data.data || [];
    },
  });

  const suppliers = suppliersData || [];
  const products = productsData || [];

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"az" | "za">("az");

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

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    address: "",
  });

  const filteredSuppliers = suppliers
    .filter((s: Supplier) =>
      searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    )
    .sort((a: Supplier, b: Supplier) =>
      sortOrder === "az"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  const toggleSort = () => {
    setSortOrder(sortOrder === "az" ? "za" : "az");
  };

  const handleOpenSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({ name: supplier.name, contact: supplier.contact, address: supplier.address });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: "", contact: "", address: "" });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier._id, supplierForm);
      } else {
        await suppliersAPI.create(supplierForm);
      }
      setIsSupplierModalOpen(false);
      refetchSuppliers(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('suppliers');
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteId) return;
    try {
      await suppliersAPI.delete(deleteId);
      setDeleteId(null);
      refetchSuppliers(true);
      // Trigger global refresh for other pages
      triggerDataRefresh('suppliers');
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  const handleAddPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, { productId: "", quantity: 1, buyPrice: 0 }]);
  };

  const handleUpdatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPurchaseItems(newItems);
  };

  const handleRemovePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) return;
    try {
      await purchasesAPI.create({
        supplierId: selectedSupplier,
        items: purchaseItems.filter(i => i.productId).map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          buyPrice: i.buyPrice
        }))
      });
      setAlertState({ open: true, title: t.common.success, message: tr("Purchase completed.", "Pembelian selesai."), variant: "success" });
      setIsPurchaseModalOpen(false);
      setPurchaseItems([]);
      setSelectedSupplier("");
      // refetchSuppliers(true); // If needed
    } catch (error) {
      console.error("Purchase error:", error);
    }
  };

  if (isLoadingSuppliers && !suppliersData) {
    return <SuppliersSkeleton />;
  }

  const isRefreshing = isRefreshingSuppliers;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header - Never blurs during refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.suppliers.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tr("Manage suppliers and create purchases", "Kelola supplier dan buat pembelian")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPurchaseModalOpen(true)} className="h-9 sm:h-10">
            <Truck className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{tr("New Purchase", "Pembelian Baru")}</span>
            <span className="sm:hidden">{tr("Purchase", "Beli")}</span>
          </Button>
          <Button onClick={() => handleOpenSupplierModal()} className="h-9 sm:h-10">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t.suppliers.addSupplier}</span>
            <span className="sm:hidden">{tr("Add", "Tambah")}</span>
          </Button>
        </div>
      </div>

      {/* Search & Sort Controls - Never blurs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={tr("Search supplier...", "Cari supplier...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="h-9 sm:h-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={toggleSort} className="flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">{sortOrder === "az" ? "A → Z" : "Z → A"}</span>
          <span className="sm:hidden">{sortOrder === "az" ? "A↓" : "Z↓"}</span>
        </Button>
      </div>

      {/* Supplier Cards - Blurs during refresh */}
      <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${isRefreshing ? 'opacity-60 blur-[0.5px]' : 'opacity-100'}`}>
        {filteredSuppliers.map((supplier: Supplier) => (
          <Card key={supplier._id} className="group hover:border-primary/50 transition-colors shadow-sm">
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <h3 className="font-bold text-base sm:text-lg">{supplier.name}</h3>
              <div className="text-xs space-y-1.5 sm:space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="h-3 w-3 text-primary" /> {supplier.contact}
                </div>
                <div className="flex items-start gap-2 italic">
                  <MapPin className="h-3 w-3 mt-0.5 text-primary" /> {supplier.address}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8 sm:h-9" onClick={() => handleOpenSupplierModal(supplier)}>{t.common.edit}</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive h-8 sm:h-9" onClick={() => setDeleteId(supplier._id)}>{t.common.delete}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSuppliers.length === 0 && !isLoadingSuppliers && (
          <div className="col-span-full py-16 sm:py-20 text-center text-xs sm:text-sm text-muted-foreground italic font-medium">
            {tr("No suppliers found.", "Supplier tidak ditemukan.")}
          </div>
        )}
      </div>

      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={editingSupplier ? t.suppliers.editSupplier : t.suppliers.addSupplier} size="md">
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <Input label={t.suppliers.name} value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
          <Input label={t.suppliers.contact} value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} required />
          <Input label={t.suppliers.address} value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} required />
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSupplierModalOpen(false)}>{t.common.cancel}</Button>
            <Button type="submit" className="flex-1">{editingSupplier ? t.common.save : t.common.add}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeleteSupplier} title={tr("Delete Supplier", "Hapus Supplier")} message={tr("Are you sure? This cannot be undone.", "Apakah Anda yakin? Data tidak bisa dikembalikan.")} variant="danger" />
      <AlertModal isOpen={alertState.open} onClose={() => setAlertState((prev) => ({ ...prev, open: false }))} title={alertState.title} message={alertState.message} variant={alertState.variant} />

      {/* Purchase Modal (Simplified for refactor brevity) */}
      <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title={tr("New Purchase", "Pembelian Baru")} size="lg">
        <div className="space-y-4">
          {/* Select Supplier */}
          <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full px-4 py-2.5 bg-card border border-input rounded-lg">
            <option value="">{t.suppliers.selectSupplier}</option>
            {suppliers.map((s: Supplier) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <div className="space-y-2">
            {purchaseItems.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <select value={item.productId} onChange={(e) => handleUpdatePurchaseItem(idx, 'productId', e.target.value)} className="flex-1 bg-card border border-input rounded p-2 text-sm">
                  <option value="">{tr("Product", "Produk")}</option>
                  {products.map((p: Product) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleUpdatePurchaseItem(idx, 'quantity', parseInt(e.target.value))} className="w-20" />
                <Input type="number" placeholder="Rp" value={item.buyPrice} onChange={(e) => handleUpdatePurchaseItem(idx, 'buyPrice', parseFloat(e.target.value))} className="w-24" />
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={handleAddPurchaseItem}>+ Add Item</Button>
          </div>
          <Button className="w-full" onClick={handlePurchaseSubmit} disabled={!selectedSupplier || purchaseItems.length === 0}>{tr("Save Purchase", "Simpan Pembelian")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function SuppliersSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="h-9 sm:h-10 w-28 sm:w-32 rounded-lg" />
          <Skeleton variant="rectangular" className="h-9 sm:h-10 w-32 sm:w-36 rounded-lg" />
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton variant="rectangular" className="h-9 sm:h-10 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton variant="rectangular" className="h-9 sm:h-10 w-24 sm:w-28 rounded-lg" />
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <Skeleton variant="rectangular" className="h-5 sm:h-6 w-32 sm:w-40" />
              <div className="space-y-2">
                <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-40 sm:w-48" />
                <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-48 sm:w-56" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton variant="rectangular" className="h-8 w-20 sm:h-9 sm:w-24 rounded-lg" />
                <Skeleton variant="rectangular" className="h-8 w-20 sm:h-9 sm:w-24 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<SuppliersSkeleton />}>
      <SuppliersContent />
    </Suspense>
  );
}
