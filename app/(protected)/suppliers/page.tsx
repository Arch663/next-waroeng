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

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const fetchSuppliers = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsAPI.getAll({ limit: 100 });
      setProducts(response.data.data?.products || response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers(suppliers.length === 0);
    fetchProducts();
  }, [fetchSuppliers, fetchProducts]);

  const filteredSuppliers = suppliers
    .filter((s) =>
      searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    )
    .sort((a, b) =>
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
      fetchSuppliers(false);
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteId) return;
    try {
      await suppliersAPI.delete(deleteId);
      setDeleteId(null);
      fetchSuppliers(false);
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
      fetchProducts();
    } catch (error) {
      console.error("Purchase error:", error);
    }
  };

  if (isLoading && suppliers.length === 0) {
    return <SuppliersSkeleton tr={tr} />;
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${isRefreshing ? 'opacity-60 blur-[0.5px]' : 'opacity-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.suppliers.title}</h1>
          <p className="text-muted-foreground mt-1">
            {tr("Manage suppliers and create purchases", "Kelola supplier dan buat pembelian")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPurchaseModalOpen(true)}>
            <Truck className="h-4 w-4 mr-2" />
            {tr("New Purchase", "Pembelian Baru")}
          </Button>
          <Button onClick={() => handleOpenSupplierModal()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.suppliers.addSupplier}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={tr("Search supplier...", "Cari supplier...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="outline" size="sm" onClick={toggleSort} className="flex items-center gap-2 h-10 px-4">
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === "az" ? "A → Z" : "Z → A"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier._id} className="group hover:border-primary/50 transition-colors shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-lg">{supplier.name}</h3>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="h-3 w-3 text-primary" /> {supplier.contact}
                </div>
                <div className="flex items-start gap-2 italic">
                  <MapPin className="h-3 w-3 mt-0.5 text-primary" /> {supplier.address}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleOpenSupplierModal(supplier)}>{t.common.edit}</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive" onClick={() => setDeleteId(supplier._id)}>{t.common.delete}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSuppliers.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic font-medium">
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
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <div className="space-y-2">
            {purchaseItems.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <select value={item.productId} onChange={(e) => handleUpdatePurchaseItem(idx, 'productId', e.target.value)} className="flex-1 bg-card border border-input rounded p-2 text-sm">
                  <option value="">{tr("Product", "Produk")}</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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

function SuppliersSkeleton({ tr }: { tr: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangular" className="h-10 w-48" />
        <div className="flex gap-2"><Skeleton variant="rectangular" className="h-10 w-32" /><Skeleton variant="rectangular" className="h-10 w-32" /></div>
      </div>
      <Skeleton variant="rectangular" className="h-12 w-full" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} variant="rectangular" className="h-44 w-full" />))}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  return (
    <Suspense fallback={<SuppliersSkeleton tr={tr} />}>
      <SuppliersContent />
    </Suspense>
  );
}
