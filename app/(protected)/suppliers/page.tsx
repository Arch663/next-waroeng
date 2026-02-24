"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertModal } from "@/components/ui/AlertModal";
import { suppliersAPI, purchasesAPI, productsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

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

export default function SuppliersPage() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  // Supplier form
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    address: "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 100 });
      setProducts(response.data.data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleOpenSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        contact: supplier.contact,
        address: supplier.address,
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: "",
        contact: "",
        address: "",
      });
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
      fetchSuppliers();
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteId) return;
    try {
      await suppliersAPI.delete(deleteId);
      setDeleteId(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  const handleAddPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, { productId: "", quantity: 1, buyPrice: 0 }]);
  };

  const handleUpdatePurchaseItem = (index: number, field: keyof PurchaseItem, value: unknown) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPurchaseItems(newItems);
  };

  const handleRemovePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      setAlertState({
        open: true,
        title: tr("Purchase", "Pembelian"),
        message: tr("Please select a supplier and add items.", "Pilih supplier dan tambahkan item."),
        variant: "warning",
      });
      return;
    }

    const items = purchaseItems.filter((item) => item.productId);
    if (items.length === 0) {
      setAlertState({
        open: true,
        title: tr("Purchase", "Pembelian"),
        message: tr("Please select at least one product.", "Pilih minimal satu produk."),
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
      setIsPurchaseModalOpen(false);
      setPurchaseItems([]);
      setSelectedSupplier("");
      fetchProducts();
    } catch (error) {
      console.error("Purchase error:", error);
      setAlertState({
        open: true,
        title: tr("Purchase Failed", "Pembelian Gagal"),
        message: tr("Failed to process purchase.", "Gagal memproses pembelian."),
        variant: "error",
      });
    }
  };

  const totalPurchaseAmount = purchaseItems.reduce(
    (sum, item) => sum + item.quantity * item.buyPrice,
    0
  );

  const hasValidItems = purchaseItems.some((item) => item.productId);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.suppliers.title}</h1>
            <p className="text-muted-foreground mt-1">
              {tr("Manage suppliers and create purchases", "Kelola supplier dan buat pembelian")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(true)}>
              {tr("New Purchase", "Pembelian Baru")}
            </Button>
            <Button onClick={() => handleOpenSupplierModal()}>
              <Plus className="h-4 w-4 mr-2" />
              {t.suppliers.addSupplier}
            </Button>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-48" />
            ))
          ) : suppliers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {tr("No suppliers found. Add your first supplier!", "Supplier belum ada. Tambahkan supplier pertama Anda!")}
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Card key={supplier._id}>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📞 {supplier.contact}</p>
                    <p>📍 {supplier.address}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenSupplierModal(supplier)}
                    >
                      {t.common.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive"
                      onClick={() => setDeleteId(supplier._id)}
                    >
                      {t.common.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Supplier Modal */}
        <Modal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          title={editingSupplier ? t.suppliers.editSupplier : t.suppliers.addSupplier}
          size="md"
        >
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <Input
              label={t.suppliers.name}
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, name: e.target.value })
              }
              required
            />
            <Input
              label={t.suppliers.contact}
              value={supplierForm.contact}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, contact: e.target.value })
              }
              required
            />
            <Input
              label={t.suppliers.address}
              value={supplierForm.address}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, address: e.target.value })
              }
              required
            />
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsSupplierModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1">
                {editingSupplier ? t.common.edit : t.common.add}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Purchase Modal */}
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title={tr("New Purchase (Restock)", "Pembelian Baru (Restock)")}
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
                className="w-full px-4 py-2.5 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                <Button type="button" size="sm" onClick={handleAddPurchaseItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  {tr("Add Item", "Tambah Item")}
                </Button>
              </div>

              {purchaseItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleUpdatePurchaseItem(index, "productId", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-card border border-input rounded-lg text-foreground text-sm"
                  >
                    <option value="">{tr("Select Product", "Pilih Produk")}</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({t.products.stock}: {p.stock})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder={tr("Qty", "Jml")}
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdatePurchaseItem(index, "quantity", parseInt(e.target.value) || 0)
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder={tr("Price", "Harga")}
                    value={item.buyPrice}
                    onChange={(e) =>
                      handleUpdatePurchaseItem(index, "buyPrice", parseFloat(e.target.value) || 0)
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePurchaseItem(index)}
                    className="text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            {purchaseItems.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tr("Total Amount", "Total Biaya")}</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(totalPurchaseAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsPurchaseModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button 
                className="flex-1" 
                onClick={handlePurchaseSubmit}
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
          onConfirm={handleDeleteSupplier}
          title={tr("Delete Supplier", "Hapus Supplier")}
          message={tr(
            "Are you sure you want to delete this supplier? This action cannot be undone.",
            "Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan."
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

