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
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
    const [isRemoveItemModalOpen, setIsRemoveItemModalOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<CartItemToRemove | null>(null);
    const [cashPaid, setCashPaid] = useState("");

    // Format number to Indonesian format (e.g., 10000 -> 10.000)
    const formatToIDR = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, "");
        if (!numericValue) return "";
        return parseInt(numericValue).toLocaleString("id-ID");
    };

    // Parse formatted string to number
    const parseToNumber = (value: string) => {
        return parseInt(value.replace(/\./g, "")) || 0;
    };

    const handleCashPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, "");
        if (!numericValue) {
            setCashPaid("");
        } else {
            setCashPaid(formatToIDR(numericValue));
        }
    };
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
        setIsMounted(true);
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
        const cash = parseToNumber(cashPaid);
        if (cash < totalAmount) {
            setAlertState({ open: true, title: "Checkout", message: language === "id" ? "Uang tunai kurang." : "Cash is less than total.", variant: "warning" });
            return;
        }
        try {
            const transactionData = { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })), cashPaid: parseToNumber(cashPaid) };
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
        <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isMounted && isLoading ? 'opacity-60' : 'opacity-100'}`}>
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.cashier.checkout}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {tr("Process sales and manage cart", "Proses penjualan dan kelola keranjang")}
                    </p>
                </div>
                {items.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setIsClearCartModalOpen(true)} className="hidden sm:flex h-9 sm:h-10">
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
                                <div className="text-center py-10 sm:py-12 md:py-16">
                                    <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">
                                        {tr("Cart is Empty", "Keranjang Kosong")}
                                    </h3>
                                    <Button onClick={() => setIsAddProductModalOpen(true)} className="h-9 sm:h-10">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {tr("Add Products", "Tambah Produk")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2.5 sm:space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex flex-col gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-muted/30 rounded-lg border border-border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.productName}</h4>
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                    {formatCurrency(item.price)} / {tr("item", "item")}
                                                </p>
                                            </div>

                                            {/* Controls - Responsive layout */}
                                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                    >
                                                        <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </Button>
                                                    <span className="w-7 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                    >
                                                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="text-right">
                                                        <p className="font-bold text-primary text-sm sm:text-base">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFromCart(item.productId, item.productName)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Total */}
                                    <div className="border-t border-border pt-2.5 sm:pt-3 md:pt-4 mt-3 sm:mt-4 flex justify-between items-center px-0.5">
                                        <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-tight">{tr("Total:", "Total Belanja:")}</span>
                                        <span className="text-base sm:text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
                                    </div>

                                    {/* Add More Button */}
                                    <div className="flex gap-2 sm:gap-3 pt-2.5 sm:pt-3">
                                        <Button variant="outline" className="flex-1 h-9 sm:h-10" onClick={() => setIsAddProductModalOpen(true)}>
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
                        <CardContent className="space-y-3 sm:space-y-4 pt-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">{tr("Items", "Total Item")}</span>
                                <span className="font-semibold">{cartItemCount}</span>
                            </div>
                            <div className="border-t border-border pt-3 sm:pt-4">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tr("Total", "Total")}</span>
                                    <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                                </div>
                                <Button className="w-full h-10 sm:h-11 sm:h-12 rounded-lg font-semibold" size="md" disabled={items.length === 0} onClick={() => setIsCheckoutModalOpen(true)}>
                                    {tr("Payment", "Bayar Sekarang")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title={tr("Add Products", "Tambah Produk")} size="lg">
                <div className="space-y-3 sm:space-y-4">
                    <Input placeholder={t.cashier.searchProduct} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="h-4 w-4" />} className="h-10 sm:h-11 bg-muted/30 text-sm sm:text-base" />
                    <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {products.length === 0 ? (
                            <div className="col-span-full text-center py-8 sm:py-10 text-sm sm:text-base text-muted-foreground italic">{tr("No products found.", "Produk tidak ditemukan.")}</div>
                        ) : (
                            products.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/20 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-semibold truncate text-xs sm:text-sm">{product.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                                            {t.products.stock}: {product.stock} | {formatCurrency(product.price)}
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddToCart(product)} className="rounded-xl h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0"><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={t.cashier.checkout} size="sm">
                <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-xl flex justify-between items-center border border-border/50">
                        <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-tight">Total</span>
                        <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    {/* Quick Cash Buttons */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase">Pembayaran Cepat</label>
                        <div className="grid grid-cols-4 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCashPaid(formatToIDR("10000"))}
                                className="h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                            >
                                10rb
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCashPaid(formatToIDR("20000"))}
                                className="h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                            >
                                20rb
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCashPaid(formatToIDR("50000"))}
                                className="h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                            >
                                50rb
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCashPaid(formatToIDR("100000"))}
                                className="h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                            >
                                100rb
                            </Button>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCashPaid(formatToIDR(Math.ceil(totalAmount).toString()))}
                            className="w-full h-9 sm:h-10 text-xs sm:text-sm font-bold bg-primary hover:bg-primary-hover"
                        >
                            Uang Pas ({formatCurrency(totalAmount)})
                        </Button>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase">{t.cashier.cashPaid}</label>
                        <Input 
                            type="text" 
                            value={cashPaid} 
                            onChange={handleCashPaidChange} 
                            placeholder="0" 
                            className="h-10 sm:h-11 sm:h-12 text-base sm:text-lg font-bold" 
                        />
                    </div>
                    {cashPaid && parseToNumber(cashPaid) >= totalAmount && (
                        <div className="p-3 sm:p-4 bg-success/10 rounded-xl border border-success/20 flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-bold text-success uppercase">{t.cashier.change}</span>
                            <span className="text-base sm:text-lg font-bold text-success">{formatCurrency(parseToNumber(cashPaid) - totalAmount)}</span>
                        </div>
                    )}
                    <div className="flex gap-2 pt-3 sm:pt-4">
                        <Button variant="outline" className="flex-1 h-9 sm:h-10" onClick={() => setIsCheckoutModalOpen(false)}>{t.common.cancel}</Button>
                        <Button className="flex-1 font-bold h-9 sm:h-10" onClick={handleCheckout} disabled={!cashPaid || parseToNumber(cashPaid) < totalAmount}>{tr("Confirm", "Selesaikan")}</Button>
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
        <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
                <div className="space-y-2">
                    <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
                    <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
                </div>
                <Skeleton variant="rectangular" className="h-9 sm:h-10 w-28 sm:w-32 rounded-lg hidden sm:block" />
            </div>

            {/* Main Grid */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                {/* Cart Section */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                    <Card>
                        <CardHeader className="py-3 sm:py-4 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton variant="rectangular" className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                                    <Skeleton variant="rectangular" className="h-5 sm:h-6 w-20 sm:w-24" />
                                </div>
                                <Skeleton variant="rectangular" className="h-5 sm:h-6 w-12 sm:w-16 rounded-lg" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2.5 sm:space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex flex-col gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-muted/20 rounded-xl border border-border">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="rectangular" className="h-4 sm:h-5 w-3/4" />
                                            <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-1/4" />
                                        </div>
                                        <div className="flex gap-2 sm:gap-3 items-center mt-2 sm:mt-0 pt-2.5 sm:pt-0 border-t sm:border-0 border-border/50">
                                            <div className="flex gap-1.5 sm:gap-2 items-center">
                                                <Skeleton variant="rectangular" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                                                <Skeleton variant="rectangular" className="h-4 sm:h-5 w-6 sm:w-7" />
                                                <Skeleton variant="rectangular" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                                            </div>
                                            <div className="flex gap-2 sm:gap-3 items-center ml-auto">
                                                <Skeleton variant="rectangular" className="h-4 sm:h-5 w-14 sm:w-16" />
                                                <Skeleton variant="rectangular" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total & Add More */}
                            <div className="border-t border-border pt-2.5 sm:pt-3 md:pt-4 mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                                <div className="flex justify-between items-center">
                                    <Skeleton variant="rectangular" className="h-4 sm:h-5 w-20 sm:w-24" />
                                    <Skeleton variant="rectangular" className="h-5 sm:h-6 w-24 sm:w-28" />
                                </div>
                                <Skeleton variant="rectangular" className="h-9 sm:h-10 w-full rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="py-3 sm:py-4">
                            <Skeleton variant="rectangular" className="h-5 sm:h-6 w-24 sm:w-32" />
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-3">
                            <div className="flex justify-between items-center">
                                <Skeleton variant="rectangular" className="h-4 w-12 sm:w-16" />
                                <Skeleton variant="rectangular" className="h-4 w-6 sm:w-8" />
                            </div>
                            <div className="border-t border-border pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton variant="rectangular" className="h-4 sm:h-5 w-12 sm:w-16" />
                                    <Skeleton variant="rectangular" className="h-6 sm:h-7 w-20 sm:w-24" />
                                </div>
                                <Skeleton variant="rectangular" className="h-10 sm:h-11 w-full rounded-lg" />
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
