"use client";

import React, { useCallback, Suspense, useMemo } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { reportsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { useChartTheme } from "@/lib/useChartTheme";
import { formatCurrency } from "@/lib/utils";
import { usePageData } from "@/lib/usePageData";
import { useDataRefresh } from "@/lib/useDataRefresh";
import {
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Filler,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Filler,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  overview: {
    totalProducts: number;
    lowStockProducts: number;
    todayRevenue: number;
    todaySalesCount: number;
    monthRevenue: number;
  };
  last7Days: { date: string; revenue: number; sales: number }[];
  topProducts: { _id: string; productName: string; totalQty: number; totalRevenue: number }[];
  categoryRevenue: { _id: string; categoryName: string; revenue: number }[];
}

function DashboardContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const theme = useChartTheme();

  const { data, isLoading, isRefreshing, refetch } = usePageData<DashboardData>({
    key: "dashboard",
    fetchFn: async () => {
      const response = await reportsAPI.getDashboard();
      return response.data.data as DashboardData;
    },
  });

  // Listen for refresh events and auto-refetch dashboard data
  useDataRefresh(['dashboard', 'checkout', 'reports', 'all'], useCallback(() => {
    refetch(true);
  }, [refetch]));

  // Destructure theme colors
  const { c1, c2, c3, c4, c5, border } = theme;

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.last7Days.map((d) =>
        new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })
      ),
      datasets: [
        {
          label: tr("Revenue", "Pendapatan"),
          data: data.last7Days.map((d) => d.revenue),
          backgroundColor: c1 + "cc",
          borderColor: c1,
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }, [data, tr, c1]);

  const salesLineData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.last7Days.map((d) =>
        new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })
      ),
      datasets: [
        {
          label: tr("Sales", "Transaksi"),
          data: data.last7Days.map((d) => d.sales),
          borderColor: c1,
          backgroundColor: c4 + "c3",
          tension: 0.30,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: c2,
        },
      ],
    };
  }, [data, tr, c1, c2, c4]);

  const stockHealthData = useMemo(() => {
    if (!data) return null;
    return {
      labels: [tr("Healthy Stock", "Stok Aman"), tr("Low Stock", "Stok Rendah")],
      datasets: [
        {
          data: [
            Math.max(data.overview.totalProducts - data.overview.lowStockProducts, 0),
            data.overview.lowStockProducts,
          ],
          backgroundColor: [c1 + "cc", c3 + "cc"],
          borderColor: [c1, c3],
          borderWidth: 2,
        },
      ],
    };
  }, [data, tr, c1, c3]);

  const categoryColors = useMemo(() => [c1, c2, c3, c4, c5, c1, c2, c3, c4, c5], [c1, c2, c3, c4, c5]);
  const categoryData = useMemo(() => {
    if (!data) return null;
    return {
      labels: (data.categoryRevenue || []).map((c) => c.categoryName),
      datasets: [
        {
          data: (data.categoryRevenue || []).map((c) => c.revenue),
          backgroundColor: categoryColors.slice(0, (data.categoryRevenue || []).length).map(c => c + "cc"),
          borderColor: categoryColors.slice(0, (data.categoryRevenue || []).length),
          borderWidth: 2,
        },
      ],
    };
  }, [data, categoryColors]);

  const topProductsData = useMemo(() => {
    if (!data) return null;
    // Sort by totalQty descending, then by _id for stable ordering when values are equal
    const sortedProducts = [...(data.topProducts || [])].sort((a, b) => {
      if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
      return a._id.localeCompare(b._id); // Stable sort for equal values
    });
    return {
      labels: sortedProducts.map((p) =>
        p.productName.length > 15 ? p.productName.slice(0, 15) + "..." : p.productName
      ),
      datasets: [
        {
          label: tr("Qty Sold", "Qty Terjual"),
          data: sortedProducts.map((p) => p.totalQty),
          backgroundColor: [c1, c2, c3, c4, c5].map(c => c + "cc"),
          borderColor: [c1, c2, c3, c4, c5],
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }, [data, tr, c1, c2, c3]);

  if (isLoading && !data) {
    return <DashboardSkeleton t={t} />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {language === "id" ? "Gagal memuat data dashboard" : "Failed to load dashboard data"}
        </p>
      </div>
    );
  }

  const isRefreshingUI = isRefreshing;

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: border + "66" },
        ticks: { color: theme.textColor },
      },
      x: {
        grid: { display: false },
        ticks: { color: theme.textColor },
      },
    },
  };

  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: theme.textColor, padding: 12, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.parsed)}`,
        },
      },
    },
  };

  const topProductsOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: border + "66" },
        ticks: { color: theme.textColor, precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { color: theme.textColor },
      },
    },
  };

  return (
    <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isRefreshingUI ? 'opacity-60' : 'opacity-100'}`}>
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {tr("Overview of your shop performance", "Ringkasan performa toko Anda")}
        </p>
      </div>

      {/* Stat Cards - Responsive Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title={tr("Total Products", "Total Produk")}
          value={data.overview.totalProducts}
          icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
        <StatCard
          title={t.dashboard.lowStock}
          value={data.overview.lowStockProducts}
          icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
        <StatCard
          title={tr("Today's Revenue", "Pendapatan Hari Ini")}
          value={formatCurrency(data.overview.todayRevenue)}
          icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
        <StatCard
          title={tr("Today's Sales", "Penjualan Hari Ini")}
          value={data.overview.todaySalesCount}
          icon={<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
        <StatCard
          title={tr("Monthly Revenue", "Pendapatan Bulanan")}
          value={formatCurrency(data.overview.monthRevenue)}
          icon={<CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72">
              {chartData && (<Bar data={chartData} options={chartOptions} />)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">{tr("Stock Health", "Kondisi Stok")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72">
              {stockHealthData && (<Doughnut data={stockHealthData} options={donutOptions} />)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">{tr("Last 7 Days Sales Trend", "Tren Penjualan 7 Hari Terakhir")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 sm:h-64 lg:h-72">
            {salesLineData && (
              <Line
                data={salesLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0, color: theme.textColor },
                      grid: { color: border + "66" },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: theme.textColor },
                    },
                  },
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 3 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">
              {tr("Revenue by Category (This Month)", "Pendapatan per Kategori (Bulan Ini)")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72">
              {(data.categoryRevenue || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm">
                  {tr("No data yet", "Belum ada data")}
                </div>
              ) : (
                categoryData && (<Doughnut data={categoryData} options={donutOptions} />)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">{tr("Top 5 Products by Sales", "5 Produk Terlaris")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72">
              {(data.topProducts || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm">
                  {tr("No data yet", "Belum ada data")}
                </div>
              ) : (
                topProductsData && (<Bar data={topProductsData} options={topProductsOptions} />)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton({ t }: { t: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton variant="rectangular" className="h-10 w-48" />
        <Skeleton variant="rectangular" className="h-4 w-64" />
      </div>

      {/* Responsive Stat Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 bg-card rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton variant="rectangular" className="h-4 w-24" />
              <Skeleton variant="rectangular" className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton variant="rectangular" className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><Skeleton variant="rectangular" className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton variant="rectangular" className="h-72 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton variant="rectangular" className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton variant="rectangular" className="h-72 w-full" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><Skeleton variant="rectangular" className="h-6 w-64" /></CardHeader>
        <CardContent><Skeleton variant="rectangular" className="h-72 w-full" /></CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader><Skeleton variant="rectangular" className="h-6 w-56" /></CardHeader>
          <CardContent><Skeleton variant="rectangular" className="h-80 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton variant="rectangular" className="h-6 w-56" /></CardHeader>
          <CardContent><Skeleton variant="rectangular" className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<DashboardSkeleton t={t} />}>
      <DashboardContent />
    </Suspense>
  );
}
