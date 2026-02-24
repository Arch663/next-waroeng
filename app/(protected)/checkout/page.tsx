"use client";

import React, { useEffect, useState } from "react";
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
  categoryId: {
    _id: string;
    name: string;
  };
}

interface CartItemToRemove {
  productId: string;
  productName: string;
}

export default function CheckoutPage() {
  const { t, language } = useLanguage();
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

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
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
  };

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
      setAlertState({
        open: true,
        title: "Checkout",
        message: language === "id" ? "Keranjang kosong." : "Cart is empty.",
        variant: "warning",
      });
      return;
    }

    const cash = parseFloat(cashPaid) || 0;
    if (cash < totalAmount) {
      setAlertState({
        open: true,
        title: "Checkout",
        message: language === "id" ? "Uang tunai kurang dari total." : "Cash paid is less than total amount.",
        variant: "warning",
      });
      return;
    }

    try {
      const transactionData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        cashPaid: cash,
      };

      await transactionsAPI.create(transactionData);

      setAlertState({
        open: true,
        title: "Success",
        message: language === "id" ? "Transaksi berhasil diselesaikan." : "Transaction completed successfully.",
        variant: "success",
      });
      clearCart();
      setIsCheckoutModalOpen(false);
      setCashPaid("");
    } catch (error: any) {
      console.error("Checkout error:", error);
      const message = error.response?.data?.message || error.message || "Failed to process transaction";
      setAlertState({
        open: true,
        title: language === "id" ? "Checkout Gagal" : "Checkout Failed",
        message,
        variant: "error",
      });
    }
  };

  const handleClearCart = () => {
    clearCart();
    setIsClearCartModalOpen(false);
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.cashier.checkout}</h1>
            <p className="text-muted-foreground mt-1">
              {language === "id" ? "Proses penjualan dan kelola keranjang" : "Process sales and manage cart"}
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" onClick={() => setIsClearCartModalOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "id" ? "Kosongkan Keranjang" : "Clear Cart"}
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {t.cashier.cart}
                  </span>
                  {cartItemCount > 0 && (
                    <span className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">
                      {cartItemCount} {language === "id" ? "item" : "items"}
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
                    <p className="text-muted-foreground mb-6">
                      {language === "id"
                        ? 'Klik "Tambah Produk" untuk menambahkan item ke keranjang'
                        : 'Click "Add Products" to start adding items to your cart'}
                    </p>
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
                        className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {language === "id"
                              ? `${formatCurrency(item.price)} per item`
                              : `${formatCurrency(item.price)} per item`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="rounded-xl"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className="rounded-xl"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right min-w-24">
                          <p className="font-bold text-primary">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.productId, item.productName)}
                          className="text-destructive hover:text-destructive rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex items-center justify-between text-xl font-bold">
                        <span>{language === "id" ? "Total Belanja:" : "Total Amount:"}</span>
                        <span className="text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsAddProductModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === "id" ? "Tambah Produk Lagi" : "Add More Products"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
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
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{t.cashier.total}</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
                {items.length > 0 && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsCheckoutModalOpen(true)}
                  >
                    {language === "id" ? "Bayar Sekarang" : "Checkout Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        title={language === "id" ? "Tambah Produk" : "Add Products"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder={t.cashier.searchProduct}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="h-12"
          />

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" className="h-20" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "id" ? "Produk tidak ditemukan" : "No products found"}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.products.stock}: {product.stock} | {formatCurrency(product.price)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title={t.cashier.checkout}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{language === "id" ? "Total Belanja" : "Total Amount"}</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <Input
            label={t.cashier.cashPaid}
            type="number"
            value={cashPaid}
            onChange={(e) => setCashPaid(e.target.value)}
            placeholder={language === "id" ? "Masukkan jumlah diterima" : "Enter amount received"}
            className="h-12"
          />

          {cashPaid && parseFloat(cashPaid) >= totalAmount && (
            <div className="p-4 bg-success/10 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-success">{t.cashier.change}</span>
                <span className="text-xl font-bold text-success">
                  {formatCurrency(parseFloat(cashPaid) - totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsCheckoutModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button className="flex-1" onClick={handleCheckout}>
              {language === "id" ? "Selesaikan Penjualan" : "Complete Sale"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Cart Confirmation */}
      <ConfirmModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={handleClearCart}
        title={language === "id" ? "Kosongkan Keranjang" : "Clear Cart"}
        message={
          language === "id"
            ? "Apakah Anda yakin ingin mengosongkan semua item dari keranjang?"
            : "Are you sure you want to clear all items from the cart?"
        }
        variant="warning"
      />

      {/* Remove Item Confirmation */}
      <ConfirmModal
        isOpen={isRemoveItemModalOpen}
        onClose={() => {
          setIsRemoveItemModalOpen(false);
          setItemToRemove(null);
        }}
        onConfirm={confirmRemoveFromCart}
        title={language === "id" ? "Hapus Item" : "Remove Item"}
        message={
          language === "id"
            ? `Apakah Anda yakin ingin menghapus "${itemToRemove?.productName}" dari keranjang?`
            : `Are you sure you want to remove "${itemToRemove?.productName}" from the cart?`
        }
        variant="warning"
      />
      <AlertModal
        isOpen={alertState.open}
        onClose={() => setAlertState((prev) => ({ ...prev, open: false }))}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />
    </>
  );
}


