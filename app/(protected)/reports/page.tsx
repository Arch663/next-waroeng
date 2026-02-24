"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { reportsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingCart, FileText } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "purchases" | "profit">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [salesData, setSalesData] = useState<unknown>(null);
  const [purchasesData, setPurchasesData] = useState<unknown>(null);
  const [profitData, setProfitData] = useState<unknown>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [dashboard, sales, purchases, profit] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getSales(dateRange),
        reportsAPI.getPurchases(dateRange),
        reportsAPI.getProfit(dateRange),
      ]);
      setDashboardData(dashboard.data.data);
      setSalesData(sales.data.data);
      setPurchasesData(purchases.data.data);
      setProfitData(profit.data.data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-24" />
            ))}
          </div>
          <Skeleton variant="rectangular" className="h-80" />
        </div>
    );
  }

  const getCssVar = (name: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const c1 = getCssVar("--chart-1", "#d6452b");
  const c2 = getCssVar("--chart-2", "#ef7b45");
  const c3 = getCssVar("--chart-3", "#e18a19");
  const c4 = getCssVar("--chart-4", "#3f8c4f");
  const c5 = getCssVar("--chart-5", "#a61e1e");

  const renderOverview = () => {
    if (!dashboardData) return null;
    const data = dashboardData as {
      overview: {
        totalProducts: number;
        lowStockProducts: number;
        todayRevenue: number;
        todaySalesCount: number;
        monthRevenue: number;
      };
      last7Days: { date: string; revenue: number; sales: number }[];
    };

    const chartData = {
      labels: data.last7Days.map((d) => new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })),
      datasets: [
        {
          label: tr("Revenue", "Pendapatan"),
          data: data.last7Days.map((d) => d.revenue),
          backgroundColor: c1,
          borderColor: c2,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tr("Monthly Revenue", "Pendapatan Bulanan")}</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.overview.monthRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tr("Today's Revenue", "Pendapatan Hari Ini")}</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.overview.todayRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tr("Today's Sales", "Penjualan Hari Ini")}</p>
                  <p className="text-2xl font-bold">{data.overview.todaySalesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <FileText className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tr("Low Stock Items", "Item Stok Rendah")}</p>
                  <p className="text-2xl font-bold">{data.overview.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSales = () => {
    if (!salesData) return null;
    const data = salesData as {
      transactions: {
        _id: string;
        items: unknown[];
        totalAmount: number;
        cashPaid: number;
        change: number;
        createdAt: string;
      }[];
      summary: {
        totalSales: number;
        totalRevenue: number;
        avgTransaction: number;
      };
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Sales", "Total Penjualan")}</p>
              <p className="text-2xl font-bold">{data.summary.totalSales}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Avg Transaction", "Rata-rata Transaksi")}</p>
              <p className="text-2xl font-bold">{formatCurrency(data.summary.avgTransaction)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tr("Transactions", "Transaksi")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{tr("No transactions found", "Transaksi tidak ditemukan")}</p>
              ) : (
                data.transactions.map((t) => (
                  <div key={t._id} className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatDateShort(t.createdAt)}</p>
                      <p className="text-sm text-muted-foreground">{t.items.length} {tr("items", "item")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(t.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">{tr("Change", "Kembalian")}: {formatCurrency(t.change)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPurchases = () => {
    if (!purchasesData) return null;
    const data = purchasesData as {
      purchases: {
        _id: string;
        supplierName: string;
        totalAmount: number;
        items: unknown[];
        createdAt: string;
      }[];
      summary: {
        totalPurchases: number;
        totalSpent: number;
      };
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Purchases", "Total Pembelian")}</p>
              <p className="text-2xl font-bold">{data.summary.totalPurchases}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Spent", "Total Pengeluaran")}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.summary.totalSpent)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tr("Purchase History", "Riwayat Pembelian")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.purchases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{tr("No purchases found", "Pembelian tidak ditemukan")}</p>
              ) : (
                data.purchases.map((p) => (
                  <div key={p._id} className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.supplierName}</p>
                      <p className="text-sm text-muted-foreground">{formatDateShort(p.createdAt)}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(p.totalAmount)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProfit = () => {
    if (!profitData) return null;
    const data = profitData as {
      summary: {
        totalRevenue: number;
        totalPurchaseCost: number;
        grossProfit: number;
        profitMargin: number;
      };
    };

    const pieData = {
      labels: [tr("Revenue", "Pendapatan"), tr("Cost", "Biaya"), tr("Profit", "Laba")],
      datasets: [
        {
          data: [data.summary.totalRevenue, data.summary.totalPurchaseCost, data.summary.grossProfit],
          backgroundColor: [c1, c5, c4],
          borderColor: [c2, c5, c4],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Total Cost", "Total Biaya")}</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(data.summary.totalPurchaseCost)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Gross Profit", "Laba Kotor")}</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(data.summary.grossProfit)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{tr("Profit Margin", "Margin Laba")}</p>
              <p className="text-2xl font-bold">{data.summary.profitMargin}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{tr("Financial Overview", "Ringkasan Keuangan")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{tr("Summary", "Ringkasan")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>{tr("Revenue", "Pendapatan")}</span>
                <span className="font-bold text-primary">{formatCurrency(data.summary.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>{tr("Cost of Goods", "Biaya Barang")}</span>
                <span className="font-bold text-destructive">{formatCurrency(data.summary.totalPurchaseCost)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <span>{tr("Gross Profit", "Laba Kotor")}</span>
                <span className="font-bold text-success">{formatCurrency(data.summary.grossProfit)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.reports.title}</h1>
            <p className="text-muted-foreground mt-1">
              {tr("Financial and performance analytics", "Analitik keuangan dan performa")}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-40"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: "overview", label: tr("Overview", "Ringkasan") },
            { id: "sales", label: tr("Sales", "Penjualan") },
            { id: "purchases", label: tr("Purchases", "Pembelian") },
            { id: "profit", label: tr("Profit", "Laba") },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="rounded-b-none"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "sales" && renderSales()}
        {activeTab === "purchases" && renderPurchases()}
        {activeTab === "profit" && renderProfit()}
      </div>
  );
}

