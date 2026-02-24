"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { reportsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
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
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cacheKey = "dashboard_cache_v1";
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DashboardData;
        setData(parsed);
        setIsLoading(false);
      } catch {
        // ignore invalid cache
      }
    }

    const fetchDashboard = async () => {
      try {
        const response = await reportsAPI.getDashboard();
        const payload = response.data.data as DashboardData;
        setData(payload);
        sessionStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton variant="rectangular" className="h-80 w-full" />
      </div>
    );
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

  const getCssVar = (name: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const c1 = getCssVar("--chart-1", "#d6452b");
  const c2 = getCssVar("--chart-2", "#ef7b45");
  const c3 = getCssVar("--chart-3", "#e18a19");
  const c4 = getCssVar("--chart-4", "#3f8c4f");
  const border = getCssVar("--border", "#f0c8bb");

  const chartData = {
    labels: data.last7Days.map((d) => new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })),
    datasets: [
      {
        label: "Revenue",
        data: data.last7Days.map((d) => d.revenue),
        backgroundColor: c1,
        borderColor: c2,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const salesLineData = {
    labels: data.last7Days.map((d) => new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })),
    datasets: [
      {
        label: "Sales",
        data: data.last7Days.map((d) => d.sales),
        borderColor: c4,
        backgroundColor: c2,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const stockHealthData = {
    labels: [tr("Healthy Stock", "Stok Aman"), tr("Low Stock", "Stok Rendah")],
    datasets: [
      {
        data: [
          Math.max(data.overview.totalProducts - data.overview.lowStockProducts, 0),
          data.overview.lowStockProducts,
        ],
        backgroundColor: [c4, c3],
        borderColor: [c4, c3],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: border } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1 sm:text-base">
          {tr("Overview of your shop performance", "Ringkasan performa toko Anda")}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={tr("Total Products", "Total Produk")} value={data.overview.totalProducts} icon={<Package className="h-6 w-6" />} variant="default" />
        <StatCard title={t.dashboard.lowStock} value={data.overview.lowStockProducts} icon={<AlertTriangle className="h-6 w-6" />} variant="default" />
        <StatCard title={tr("Today's Revenue", "Pendapatan Hari Ini")} value={formatCurrency(data.overview.todayRevenue)} icon={<DollarSign className="h-6 w-6" />} variant="default" />
        <StatCard title={tr("Today's Sales", "Penjualan Hari Ini")} value={data.overview.todaySalesCount} icon={<ShoppingCart className="h-6 w-6" />} variant="default" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{tr("Stock Health", "Kondisi Stok")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <Doughnut data={stockHealthData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" as const } } }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tr("Last 7 Days Sales Trend", "Tren Penjualan 7 Hari Terakhir")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 sm:h-80">
            <Line
              data={salesLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tr("Monthly Summary", "Ringkasan Bulanan")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{tr("Monthly Revenue", "Pendapatan Bulanan")}</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(data.overview.monthRevenue)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{tr("Daily Average", "Rata-rata Harian")}</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.overview.monthRevenue / 30)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

