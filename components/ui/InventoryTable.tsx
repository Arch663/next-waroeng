"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import { ChevronLeft, ChevronRight, Search, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

export interface InventoryItem {
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
}

type SortField = "name" | "sku" | "price" | "stock";
type SortOrder = "asc" | "desc" | null;

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  totalItems?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  showActions?: boolean;
  hideSearch?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
  isLoading = false,
  totalItems = 0,
  page = 1,
  onPageChange,
  onSearch,
  showActions = true,
  hideSearch = false,
}) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((totalItems || items.length) / itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortedItems = () => {
    if (!sortField || !sortOrder) return items;

    return [...items].sort((a, b) => {
      let aVal: string | number | undefined = a[sortField];
      let bVal: string | number | undefined = b[sortField];

      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === "sku") {
        aVal = (a.sku || "").toLowerCase();
        bVal = (b.sku || "").toLowerCase();
      }

      const left = aVal ?? "";
      const right = bVal ?? "";
      if (sortOrder === "asc") {
        return left < right ? -1 : left > right ? 1 : 0;
      }
      return left > right ? -1 : left < right ? 1 : 0;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortOrder) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === "asc"
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
  };

  const sortedItems = getSortedItems();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header with search */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {t.inventory.title} ({totalItems} {language === "id" ? "item" : "items"})
          </h2>
          {!hideSearch && (
            <div className="w-64">
              <Input
                placeholder={t.cashier.searchProduct}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                className="h-10"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  {language === "id" ? "Produk" : "Product"}
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  onClick={() => handleSort("sku")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  SKU
                  <SortIcon field="sku" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                {t.products.category}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                >
                  {language === "id" ? "Harga" : "Price"}
                  <SortIcon field="price" />
                </button>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                <button
                  onClick={() => handleSort("stock")}
                  className="flex items-center justify-center w-full hover:text-foreground transition-colors"
                >
                  {t.products.stock}
                  <SortIcon field="stock" />
                </button>
              </th>
              {showActions && (
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  {t.common.actions}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-20 ml-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-12 mx-auto" />
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : sortedItems.length === 0 ? (
              <tr>
                  <td colSpan={showActions ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">
                  {language === "id" ? "Produk tidak ditemukan" : "No products found"}
                  </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item._id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{item.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{item.sku || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{item.categoryId?.name || "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-primary">{formatCurrency(item.price)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      item.stock === 0 ? "bg-destructive/10 text-destructive" :
                        item.stock < 10 ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                    )}>
                      {item.stock}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="rounded-xl"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item._id)}
                            className="text-destructive hover:text-destructive rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {language === "id" ? "Halaman" : "Page"} {page} {language === "id" ? "dari" : "of"} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
