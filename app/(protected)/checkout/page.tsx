"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { productsAPI, transactionsAPI } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { Search, ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItemToRemove {
  productId: string;
  productName: string;
}

function CheckoutContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [isRemoveItemModalOpen, setIsRemoveItemModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItemToRemove | null>(null);
  const [cashPaid, setCashPaid] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "warning" | "error" | "info";
  }>({
    open: false,
    title: language === "id" ? "Notifikasi" : "Notification",
    message: "",
    variant: "info",
  });

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalAmount } = useCartStore();

  const totalAmount = getTotalAmount();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { search: searchTerm, limit: 50 };
      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products.filter((p: Product) => p.stock > 0));
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setIsAddProductModalOpen(false);
    setSearchTerm("");
  };

  const handleRemoveFromCart = (productId: string, productName: string) => {
    setItemToRemove({ productId, productName });
    setIsRemoveItemModalOpen(true);
  };

  const confirmRemoveFromCart = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.productId);
      setItemToRemove(null);
      setIsRemoveItemModalOpen(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setAlertState({ open: true, title: "Checkout", message: language === "id" ? "Keranjang kosong." : "Cart is empty.", variant: "warning" });
      return;
    }
    const cash = parseFloat(cashPaid) || 0;
    if (cash < totalAmount) {
      setAlertState({ open: true, title: "Checkout", message: language === "id" ? "Uang tunai kurang." : "Cash is less than total.", variant: "warning" });
      return;
    }
    try {
      const transactionData = { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })), cashPaid: cash };
      await transactionsAPI.create(transactionData);
      setAlertState({ open: true, title: t.common.success, message: language === "id" ? "Transaksi berhasil." : "Transaction successful.", variant: "success" });
      clearCart();
      setIsCheckoutModalOpen(false);
      setCashPaid("");
    } catch (error: any) {
      console.error("Checkout error:", error);
      setAlertState({ open: true, title: "Error", message: "Failed to process transaction", variant: "error" });
    }
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight [@media(max-width:400px)]:text-xl">{t.cashier.checkout}</h1>
          <p className="text-muted-foreground mt-1 text-sm [@media(max-width:400px)]:text-xs">
            {language === "id" ? "Proses penjualan dan kelola keranjang" : "Process sales and manage cart"}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setIsClearCartModalOpen(true)} className="[@media(max-width:400px)]:w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            {language === "id" ? "Kosongkan" : "Clear"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t.cashier.cart}
                </span>
                {cartItemCount > 0 && (
                  <span className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    {cartItemCount} item
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === "id" ? "Keranjang Kosong" : "Cart is Empty"}
                  </h3>
                  <Button onClick={() => setIsAddProductModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "id" ? "Tambah Produk" : "Add Products"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted rounded-xl border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} per item
                        </p>
                      </div>

                      {/* Kontrol Kuantitas & Subtotal (Mobile Responsive) */}
                      {/* grid-cols-1 for screens < 400px via style or helper class */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 [@media(max-width:400px)]:flex-col [@media(max-width:400px)]:items-stretch">
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="rounded-xl h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="rounded-xl h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 [@media(max-width:400px)]:border-t [@media(max-width:400px)]:pt-3 [@media(max-width:400px)]:mt-1">
                          <div className="text-right min-w-[100px]">
                            <p className="font-bold text-primary">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.productId, item.productName)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-border pt-4 mt-6 flex justify-between items-center text-xl font-bold">
                    <span>{language === "id" ? "Total Belanja:" : "Total Amount:"}</span>
                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setIsAddProductModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "id" ? "Tambah Produk Lagi" : "Add More Products"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{language === "id" ? "Ringkasan Pesanan" : "Order Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{language === "id" ? "Total Item" : "Total Items"}</span>
                <span className="font-semibold">{cartItemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{language === "id" ? "Produk Unik" : "Unique Products"}</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold">{t.cashier.total}</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                </div>
                <Button className="w-full h-12" size="lg" disabled={items.length === 0} onClick={() => setIsCheckoutModalOpen(true)}>
                  {language === "id" ? "Bayar Sekarang" : "Checkout Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Tambah Produk */}
      <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title={language === "id" ? "Tambah Produk" : "Add Products"} size="lg">
        <div className="space-y-4">
          <Input placeholder={t.cashier.searchProduct} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="h-4 w-4" />} className="h-12" />
          <div className="grid gap-3 md:grid-cols-2 max-h-96 overflow-y-auto pr-2">
            {products.map((product) => (
              <div key={product._id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.products.stock}: {product.stock} | {formatCurrency(product.price)}</p>
                </div>
                <Button size="sm" onClick={() => handleAddToCart(product)} className="rounded-xl ml-2"><Plus className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Pembayaran */}
      <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={t.cashier.checkout} size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-xl flex justify-between items-center">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>
          <Input label={t.cashier.cashPaid} type="number" value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} placeholder="0" className="h-12" />
          {cashPaid && parseFloat(cashPaid) >= totalAmount && (
            <div className="p-4 bg-success/10 rounded-xl flex justify-between items-center">
              <span className="text-success">{t.cashier.change}</span>
              <span className="text-xl font-bold text-success">{formatCurrency(parseFloat(cashPaid) - totalAmount)}</span>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutModalOpen(false)}>{t.common.cancel}</Button>
            <Button className="flex-1 font-semibold" onClick={handleCheckout} disabled={!cashPaid || parseFloat(cashPaid) < totalAmount}>
              {language === "id" ? "Selesaikan" : "Complete"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={isClearCartModalOpen} onClose={() => setIsClearCartModalOpen(false)} onConfirm={() => { clearCart(); setIsClearCartModalOpen(false); }} title="Kosongkan Keranjang" message="Apakah Anda yakin?" variant="warning" />
      <ConfirmModal isOpen={isRemoveItemModalOpen} onClose={() => { setIsRemoveItemModalOpen(false); setItemToRemove(null); }} onConfirm={confirmRemoveFromCart} title="Hapus Item" message={`Hapus "${itemToRemove?.productName}"?`} variant="warning" />
      <AlertModal isOpen={alertState.open} onClose={() => setAlertState((prev) => ({ ...prev, open: false }))} title={alertState.title} message={alertState.message} variant={alertState.variant} />
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="rectangular" className="h-10 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Skeleton variant="rectangular" className="h-96 w-full rounded-2xl" /></div>
        <div className="lg:col-span-1"><Skeleton variant="rectangular" className="h-64 w-full rounded-2xl" /></div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
