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
import { useDataRefresher, triggerDataRefresh } from "@/lib/useDataRefresh";
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
    const { triggerRefresh } = useDataRefresher();

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
            // Trigger data refresh for dashboard and reports
            triggerRefresh('dashboard');
            triggerRefresh('checkout');
        } catch (error: any) {
            console.error("Checkout error:", error);
            setAlertState({ open: true, title: "Error", message: "Failed to process transaction", variant: "error" });
        }
    };

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.cashier.checkout}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {tr("Process sales and manage cart", "Proses penjualan dan kelola keranjang")}
                    </p>
                </div>
                {items.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setIsClearCartModalOpen(true)} className="hidden sm:flex">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {tr("Clear", "Kosongkan")}
                    </Button>
                )}
            </div>

            {/* Main Grid - Mobile: stacked, Desktop: 2/3 + 1/3 */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Cart Section - Takes 2 columns on desktop */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    {t.cashier.cart}
                                </span>
                                {cartItemCount > 0 && (
                                    <span className="text-xs sm:text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-semibold">
                                        {cartItemCount} {tr("items", "item")}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                                        {tr("Cart is Empty", "Keranjang Kosong")}
                                    </h3>
                                    <Button onClick={() => setIsAddProductModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {tr("Add Products", "Tambah Produk")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.productName}</h4>
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                    {formatCurrency(item.price)} / {tr("item", "item")}
                                                </p>
                                            </div>

                                            {/* Controls - Responsive layout */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-bold text-primary text-sm sm:text-base">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFromCart(item.productId, item.productName)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Total */}
                                    <div className="border-t border-border pt-3 sm:pt-4 mt-4 sm:mt-6 flex justify-between items-center px-1">
                                        <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-tight">{tr("Total:", "Total Belanja:")}</span>
                                        <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                                    </div>

                                    {/* Add More Button */}
                                    <div className="flex gap-3 pt-3 sm:pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => setIsAddProductModalOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            {tr("Add More", "Tambah Produk Lagi")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar - Takes 1 column on desktop */}
                <div className="lg:col-span-1">
                    <Card className="lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle className="text-sm sm:text-base">{tr("Summary", "Ringkasan Pesanan")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">{tr("Items", "Total Item")}</span>
                                <span className="font-semibold">{cartItemCount}</span>
                            </div>
                            <div className="border-t border-border pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tr("Total", "Total")}</span>
                                    <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                                </div>
                                <Button className="w-full h-11 sm:h-12 rounded-lg font-semibold" size="md" disabled={items.length === 0} onClick={() => setIsCheckoutModalOpen(true)}>
                                    {tr("Payment", "Bayar Sekarang")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title={tr("Add Products", "Tambah Produk")} size="lg">
                <div className="space-y-4">
                    <Input placeholder={t.cashier.searchProduct} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="h-4 w-4" />} className="h-12 bg-muted/30" />
                    <div className="grid gap-3 sm:grid-cols-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {products.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-muted-foreground italic">{tr("No products found.", "Produk tidak ditemukan.")}</div>
                        ) : (
                            products.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-semibold truncate text-sm">{product.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                                            {t.products.stock}: {product.stock} | {formatCurrency(product.price)}
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddToCart(product)} className="rounded-xl h-8 w-8 p-0 shrink-0"><Plus className="h-4 w-4" /></Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={t.cashier.checkout} size="sm">
                <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl flex justify-between items-center border border-border/50">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-tight">Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase">{t.cashier.cashPaid}</label>
                        <Input type="number" value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} placeholder="0" className="h-12 text-lg font-bold" />
                    </div>
                    {cashPaid && parseFloat(cashPaid) >= totalAmount && (
                        <div className="p-4 bg-success/10 rounded-xl border border-success/20 flex justify-between items-center">
                            <span className="text-sm font-bold text-success uppercase">{t.cashier.change}</span>
                            <span className="text-xl font-bold text-success">{formatCurrency(parseFloat(cashPaid) - totalAmount)}</span>
                        </div>
                    )}
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutModalOpen(false)}>{t.common.cancel}</Button>
                        <Button className="flex-1 font-bold" onClick={handleCheckout} disabled={!cashPaid || parseFloat(cashPaid) < totalAmount}>{tr("Confirm", "Selesaikan")}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal isOpen={isClearCartModalOpen} onClose={() => setIsClearCartModalOpen(false)} onConfirm={() => { clearCart(); setIsClearCartModalOpen(false); }} title={tr("Clear Cart", "Kosongkan Keranjang")} message={tr("Are you sure?", "Apakah Anda yakin?")} variant="warning" />
            <ConfirmModal isOpen={isRemoveItemModalOpen} onClose={() => { setIsRemoveItemModalOpen(false); setItemToRemove(null); }} onConfirm={confirmRemoveFromCart} title={tr("Remove Item", "Hapus Item")} message={`Hapus "${itemToRemove?.productName}"?`} variant="warning" />
            <AlertModal isOpen={alertState.open} onClose={() => setAlertState((prev) => ({ ...prev, open: false }))} title={alertState.title} message={alertState.message} variant={alertState.variant} />
        </div>
    );
}

function CheckoutSkeleton() {
    return (
        <div className="space-y-6 px-1 sm:px-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                    <Skeleton variant="rectangular" className="h-10 w-48" />
                    <Skeleton variant="rectangular" className="h-4 w-64" />
                </div>
                <Skeleton variant="rectangular" className="h-10 w-32" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="py-4 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <Skeleton variant="rectangular" className="h-6 w-32" />
                                <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-xl border border-border">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="rectangular" className="h-5 w-3/4" />
                                            <Skeleton variant="rectangular" className="h-4 w-1/4" />
                                        </div>
                                        <div className="flex gap-4 items-center mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                                            <Skeleton variant="rectangular" className="h-8 w-24 rounded-lg" />
                                            <Skeleton variant="rectangular" className="h-6 w-20" />
                                            <Skeleton variant="rectangular" className="h-8 w-8 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader><Skeleton variant="rectangular" className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between"><Skeleton variant="rectangular" className="h-4 w-20" /><Skeleton variant="rectangular" className="h-4 w-10" /></div>
                            <div className="border-t pt-4 space-y-4">
                                <div className="flex justify-between"><Skeleton variant="rectangular" className="h-6 w-16" /><Skeleton variant="rectangular" className="h-8 w-24" /></div>
                                <Skeleton variant="rectangular" className="h-12 w-full rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
