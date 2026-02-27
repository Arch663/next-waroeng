"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, X } from "lucide-react";
import { productsAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

interface ProductItem {
  _id: string;
  name: string;
  stock: number;
  minStock?: number;
}

export const LowStockAlert: React.FC = () => {
  const { language } = useLanguage();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        // Server validates `limit` max 100, so keep request within that bound.
        const response = await productsAPI.getAll({ page: 1, limit: 100 });
        const products: ProductItem[] = response.data?.data?.products || [];
        const lows = products.filter((p) => p.stock <= (p.minStock ?? 5));
        setItems(lows.slice(0, 3));
        setCount(lows.length);
      } catch (error) {
        // Fallback in case backend sends strict query validation response.
        try {
          const fallback = await productsAPI.getAll({ page: 1, limit: 20 });
          const products: ProductItem[] = fallback.data?.data?.products || [];
          const lows = products.filter((p) => p.stock <= (p.minStock ?? 5));
          setItems(lows.slice(0, 3));
          setCount(lows.length);
        } catch (retryError) {
          console.error("Failed to check low stock:", retryError);
        }
      }
    };

    fetchLowStock();
    const timer = setInterval(fetchLowStock, 50000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (count > 0) setDismissed(false);
  }, [count]);

  const title = useMemo(() => {
    if (count <= 1) return language === "id" ? "Peringatan stok rendah" : "Low stock alert";
    return language === "id" ? `${count} item stok rendah` : `${count} low stock items`;
  }, [count, language]);

  if (dismissed || count === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 w-[min(92vw,360px)] rounded-2xl border border-warning/30 bg-card/95 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-2.5 sm:mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="rounded-xl bg-warning/15 p-2 shrink-0">
            <BellRing className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === "id" ? "Segera lakukan restock" : "Please restock soon"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted shrink-0"
          aria-label="Close low stock alert"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-warning shrink-0" />
              <span className="text-xs sm:text-sm truncate">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-destructive shrink-0 ml-2">
              {language === "id" ? "Stok" : "Stock"} {item.stock}
            </span>

          </div>
        ))}
      </div>

      <div className="mt-2.5 sm:mt-3">
        <Link href="/inventory">
          <Button size="sm" className="w-full h-9 sm:h-10">
            {language === "id" ? "Buka Inventaris" : "Open Inventory"}
          </Button>
        </Link>
      </div>
    </div>
  );
};
