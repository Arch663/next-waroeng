import React from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./Button";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

export interface Product {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
  stock: number;
  unit?: string;
  minStock?: number;
  categoryId: {
    _id: string;
    name: string;
  };
  image?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className,
}) => {
  const { t, language } = useLanguage();
  const isLowStock = product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200",
      className
    )}>
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-medium">
              {t.products.outOfStock}
            </span>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2">
            <span className="bg-warning text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {t.products.lowStockAlert}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1 tracking-tight">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {product.categoryId?.name || (language === "id" ? "Tanpa Kategori" : "Uncategorized")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-bold text-primary tracking-tight">
              {formatCurrency(product.price)}
            </p>
            <p className={cn(
              "text-xs font-medium",
              isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-success"
            )}>
              {isOutOfStock ? t.products.outOfStock : `${t.products.stock}: ${product.stock}`}
            </p>
          </div>

          {onAddToCart && !isOutOfStock && (
            <div className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAddToCart(product)}
                className="rounded-xl w-full"
              >
                {t.common.add}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
