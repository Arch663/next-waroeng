"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { reportsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { useChartTheme } from "@/lib/useChartTheme";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingCart, FileText, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { Bar, Pie } from "react-chartjs-2";

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

function ReportsContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const theme = useChartTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "purchases" | "profit" | "expenses">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [purchasesData, setPurchasesData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);

  const { c1, c2, c3, c4, c5, border } = theme;

  const fetchReports = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const isFirstLoad = !dashboardData;
    fetchReports(isFirstLoad);
  }, [fetchReports]);

  // Handle Export PDF
  const handlePrint = useCallback(async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Waroeng POS - " + t.reports.title, pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDateShort(dateRange.startDate)} s/d ${formatDateShort(dateRange.endDate)}`, pageWidth / 2, 22, { align: "center" });

    let yPos = 30;

    if (dashboardData) {
      const data = dashboardData;
      doc.setFontSize(14);
      doc.text(tr("Overview", "Ringkasan"), 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`${tr("Monthly Revenue", "Pendapatan Bulanan")}: ${formatCurrency(data.overview.monthRevenue)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Today's Revenue", "Pendapatan Hari Ini")}: ${formatCurrency(data.overview.todayRevenue)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Today's Sales", "Penjualan Hari Ini")}: ${data.overview.todaySalesCount}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Low Stock Items", "Item Stok Rendah")}: ${data.overview.lowStockProducts}`, 14, yPos); yPos += 15;
      doc.setFontSize(12);
      doc.text(tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir"), 14, yPos); yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [[tr("Date", "Tanggal"), tr("Revenue", "Pendapatan"), tr("Sales", "Penjualan")]],
        body: data.last7Days.map((d: any) => [new Date(d.date).toLocaleDateString("id-ID"), formatCurrency(d.revenue), d.sales.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 20;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
    }

    if (salesData) {
      const data = salesData;
      doc.setFontSize(14);
      doc.text(tr("Sales", "Penjualan"), 14, yPos); yPos += 10;
      doc.setFontSize(10);
      doc.text(`${tr("Total Sales", "Total Penjualan")}: ${data.summary.totalSales}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Total Revenue", "Total Pendapatan")}: ${formatCurrency(data.summary.totalRevenue)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Avg Transaction", "Rata-rata Transaksi")}: ${formatCurrency(data.summary.avgTransaction)}`, 14, yPos); yPos += 15;
      doc.setFontSize(12);
      doc.text(tr("Transactions", "Transaksi"), 14, yPos); yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [[tr("Date", "Tanggal"), tr("Items", "Item"), tr("Total", "Total")]],
        body: data.transactions.slice(0, 20).map((t: any) => [formatDateShort(t.createdAt), (t.items as any[]).length.toString(), formatCurrency(t.totalAmount)]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 20;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
    }

    if (profitData) {
      const data = profitData;
      doc.setFontSize(14);
      doc.text(tr("Profit", "Laba"), 14, yPos); yPos += 10;
      doc.setFontSize(10);
      doc.text(`${tr("Total Revenue", "Total Pendapatan")}: ${formatCurrency(data.summary.totalRevenue)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Total Cost", "Total Biaya")}: ${formatCurrency(data.summary.totalPurchaseCost)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Gross Profit", "Laba Kotor")}: ${formatCurrency(data.summary.grossProfit)}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Profit Margin", "Margin Laba")}: ${data.summary.profitMargin}%`, 14, yPos);
    }

    doc.save(`Waroeng_POS_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
  }, [dashboardData, salesData, purchasesData, profitData, dateRange, tr, t.reports.title]);

  const overviewChartData = useMemo(() => {
    if (!dashboardData) return null;
    return {
      labels: dashboardData.last7Days.map((d: any) => new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })),
      datasets: [{
        label: tr("Revenue", "Pendapatan"),
        data: dashboardData.last7Days.map((d: any) => d.revenue),
        backgroundColor: c1 + "cc",
        borderColor: c1,
        borderWidth: 2,
        borderRadius: 6,
      }],
    };
  }, [dashboardData, c1, tr]);

  const profitChartData = useMemo(() => {
    if (!profitData) return null;
    return {
      labels: [tr("Revenue", "Pendapatan"), tr("Cost", "Biaya"), tr("Profit", "Laba")],
      datasets: [{
        data: [profitData.summary.totalRevenue, profitData.summary.totalPurchaseCost, profitData.summary.grossProfit],
        backgroundColor: [c1 + "cc", c5 + "cc", c4 + "cc"],
        borderColor: [c1, c5, c4],
        borderWidth: 2,
      }],
    };
  }, [profitData, c1, c4, c5, tr]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-lg"><DollarSign className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">{tr("Monthly Revenue", "Pendapatan Bulanan")}</p><p className="text-2xl font-bold">{formatCurrency(dashboardData?.overview?.monthRevenue || 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-success/10 rounded-lg"><TrendingUp className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">{tr("Today's Revenue", "Pendapatan Hari Ini")}</p><p className="text-2xl font-bold">{formatCurrency(dashboardData?.overview?.todayRevenue || 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-warning/10 rounded-lg"><ShoppingCart className="h-6 w-6 text-warning" /></div><div><p className="text-sm text-muted-foreground">{tr("Today's Sales", "Penjualan Hari Ini")}</p><p className="text-2xl font-bold">{dashboardData?.overview?.todaySalesCount || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-destructive/10 rounded-lg"><FileText className="h-6 w-6 text-destructive" /></div><div><p className="text-sm text-muted-foreground">{tr("Low Stock Items", "Item Stok Rendah")}</p><p className="text-2xl font-bold">{dashboardData?.overview?.lowStockProducts || 0}</p></div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir")}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            {overviewChartData && (<Bar data={overviewChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: border + "66" }, ticks: { color: theme.textColor } }, x: { grid: { display: false }, ticks: { color: theme.textColor } } } } as any} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Sales", "Total Penjualan")}</p><p className="text-2xl font-bold">{salesData?.summary?.totalSales || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p><p className="text-2xl font-bold text-primary">{formatCurrency(salesData?.summary?.totalRevenue || 0)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Avg Transaction", "Rata-rata Transaksi")}</p><p className="text-2xl font-bold">{formatCurrency(salesData?.summary?.avgTransaction || 0)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{tr("Transactions", "Transaksi")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!salesData?.transactions?.length ? (
              <p className="text-center text-muted-foreground py-8 italic font-serif">{tr("No transactions found", "Transaksi tidak ditemukan")}</p>
            ) : (
              salesData.transactions.map((t: any) => (
                <div key={t._id} className="p-4 bg-muted/40 rounded-lg border border-border flex items-center justify-between hover:bg-muted/60 transition-colors">
                  <div><p className="font-medium text-foreground">{formatDateShort(t.createdAt)}</p><p className="text-xs text-muted-foreground">{t.items.length} {tr("items", "item")}</p></div>
                  <div className="text-right"><p className="font-bold text-primary">{formatCurrency(t.totalAmount)}</p><p className="text-[10px] text-muted-foreground">{tr("Change", "Kembalian")}: {formatCurrency(t.change)}</p></div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfit = () => {
    if (!profitData) return null;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p><p className="text-2xl font-bold text-primary">{formatCurrency(profitData.summary.totalRevenue)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Cost", "Total Biaya")}</p><p className="text-2xl font-bold text-destructive">{formatCurrency(profitData.summary.totalPurchaseCost)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Gross Profit", "Laba Kotor")}</p><p className="text-2xl font-bold text-success">{formatCurrency(profitData.summary.grossProfit)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Profit Margin", "Margin Laba")}</p><p className="text-2xl font-bold">{profitData.summary.profitMargin}%</p></CardContent></Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{tr("Financial Overview", "Ringkasan Keuangan")}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                {profitChartData && (<Pie data={profitChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: theme.textColor, padding: 12 } }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } } } } as any} />)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{tr("Summary", "Ringkasan")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"><span>{tr("Revenue", "Pendapatan")}</span><span className="font-bold text-primary">{formatCurrency(profitData.summary.totalRevenue)}</span></div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"><span>{tr("Cost of Goods", "Biaya Barang")}</span><span className="font-bold text-destructive">{formatCurrency(profitData.summary.totalPurchaseCost)}</span></div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20"><span>{tr("Gross Profit", "Laba Kotor")}</span><span className="font-bold text-success">{formatCurrency(profitData.summary.grossProfit)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading && !dashboardData) {
    return <ReportsSkeleton tr={tr} />;
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${isRefreshing ? 'opacity-60 blur-[1px]' : 'opacity-100 blur-0'}`}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.reports.title}</h1>
          <p className="text-muted-foreground mt-1">{tr("Financial and performance analytics", "Analitik keuangan dan performa")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{tr("From", "Dari")}:</span>
            <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-40 h-10" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{tr("To", "Ke")}:</span>
            <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-40 h-10" />
          </div>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 ml-auto shadow-sm">
            <Printer className="h-4 w-4" />
            {tr("Export PDF", "Ekspor PDF")}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border bg-card/50 p-1 rounded-t-xl overflow-x-auto">
        {[
          { id: "overview", label: tr("Overview", "Ringkasan") },
          { id: "sales", label: tr("Sales", "Penjualan") },
          { id: "purchases", label: tr("Purchases", "Pembelian") },
          { id: "profit", label: tr("Profit", "Laba") }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap ${activeTab === tab.id ? 'shadow-sm' : ''}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "sales" && renderSales()}
        {activeTab === "purchases" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Purchases", "Total Pembelian")}</p><p className="text-2xl font-bold">{purchasesData?.summary?.totalPurchases || 0}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{tr("Total Spent", "Total Pengeluaran")}</p><p className="text-2xl font-bold text-primary">{formatCurrency(purchasesData?.summary?.totalSpent || 0)}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>{tr("Purchase History", "Riwayat Pembelian")}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!purchasesData?.purchases?.length ? (
                    <p className="text-center text-muted-foreground py-8 italic font-serif">{tr("No purchases found", "Pembelian tidak ditemukan")}</p>
                  ) : (
                    purchasesData.purchases.map((p: any) => (
                      <div key={p._id} className="p-4 bg-muted/40 rounded-lg border border-border flex items-center justify-between hover:bg-muted/60 transition-colors">
                        <div><p className="font-medium text-foreground">{p.supplierName}</p><p className="text-xs text-muted-foreground">{formatDateShort(p.createdAt)}</p></div>
                        <p className="font-bold text-primary">{formatCurrency(p.totalAmount)}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === "profit" && renderProfit()}
      </div>
    </div>
  );
}

function ReportsSkeleton({ tr }: { tr: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <Skeleton variant="rectangular" className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <Skeleton variant="rectangular" className="h-10 w-32 ml-auto" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-border p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton variant="rectangular" className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton variant="rectangular" className="h-3 w-24" />
                    <Skeleton variant="rectangular" className="h-6 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton variant="rectangular" className="h-6 w-64" /></CardHeader>
          <CardContent><Skeleton variant="rectangular" className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  return (
    <Suspense fallback={<ReportsSkeleton tr={tr} />}>
      <ReportsContent />
    </Suspense>
  );
}
