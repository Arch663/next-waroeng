"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { reportsAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { usePageData } from "@/lib/usePageData";
import { usePageCache } from "@/lib/usePageCache";
import { useChartTheme } from "@/lib/useChartTheme";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingCart, FileText, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { useDataRefresh } from "@/lib/useDataRefresh";
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const { data: reportsData, isLoading, isRefreshing, refetch } = usePageData<any>({
    key: "reports-combined",
    fetchFn: async () => {
      const [dashboard, sales, purchases, profit] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getSales(dateRange),
        reportsAPI.getPurchases(dateRange),
        reportsAPI.getProfit(dateRange),
      ]);
      return {
        dashboard: dashboard.data.data,
        sales: sales.data.data,
        purchases: purchases.data.data,
        profit: profit.data.data,
      };
    },
    params: dateRange,
  });

  // Listen for refresh events and auto-refetch reports data
  useDataRefresh(['reports', 'dashboard', 'checkout', 'all'], useCallback(() => {
    // Invalidate cache to ensure fresh data from database
    const invalidateCache = usePageCache.getState().invalidateCache;
    invalidateCache('reports-combined');
    invalidateCache('dashboard');
    refetch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const dashboardData = reportsData?.dashboard || null;
  const salesData = reportsData?.sales || null;
  const purchasesData = reportsData?.purchases || null;
  const profitData = reportsData?.profit || null;

  const { c1, c2, c3, c4, c5, border } = theme;

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
      
      // Export transactions with item details
      const limitedTransactions = data.transactions.slice(0, 20);
      limitedTransactions.forEach((t: any, idx: number) => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        // Transaction header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${tr("Transaction", "Transaksi")} #${idx + 1}`, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDateShort(t.createdAt)} - ${formatCurrency(t.totalAmount)}`, 100, yPos);
        yPos += 7;
        
        // Items table
        autoTable(doc, {
          startY: yPos,
          head: [[tr("Product", "Produk"), tr("Qty", "Jml"), tr("Price", "Harga"), tr("Subtotal", "Subtotal")]],
          body: (t.items as any[]).map((item: any) => [
            item.productName,
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.subtotal)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      });
      yPos += 5;
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

    if (purchasesData) {
      const data = purchasesData;
      if (yPos > 200) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.text(tr("Purchases", "Pembelian"), 14, yPos); yPos += 10;
      doc.setFontSize(10);
      doc.text(`${tr("Total Purchases", "Total Pembelian")}: ${data.summary.totalPurchases}`, 14, yPos); yPos += 7;
      doc.text(`${tr("Total Spent", "Total Pengeluaran")}: ${formatCurrency(data.summary.totalSpent)}`, 14, yPos); yPos += 15;
      doc.setFontSize(12);
      doc.text(tr("Purchase History", "Riwayat Pembelian"), 14, yPos); yPos += 5;
      
      // Export purchases with item details
      const limitedPurchases = data.purchases.slice(0, 20);
      limitedPurchases.forEach((p: any, idx: number) => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        // Purchase header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${tr("Purchase", "Pembelian")} #${idx + 1}`, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${p.supplierName} - ${formatDateShort(p.createdAt)}`, 100, yPos);
        yPos += 7;
        
        // Items table
        autoTable(doc, {
          startY: yPos,
          head: [[tr("Product", "Produk"), tr("Qty", "Jml"), tr("Price", "Harga"), tr("Subtotal", "Subtotal")]],
          body: (p.items as any[]).map((item: any) => [
            item.productName,
            item.quantity.toString(),
            formatCurrency(item.buyPrice),
            formatCurrency(item.subtotal)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      });
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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-4 sm:pt-6"><div className="flex items-center gap-3 sm:gap-4"><div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl shrink-0"><DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /></div><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Monthly Revenue", "Pendapatan Bulanan")}</p><p className="text-base sm:text-lg lg:text-xl font-bold truncate">{formatCurrency(dashboardData?.overview?.monthRevenue || 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 sm:pt-6"><div className="flex items-center gap-3 sm:gap-4"><div className="p-2.5 sm:p-3 bg-success/10 rounded-xl shrink-0"><TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" /></div><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Today's Revenue", "Pendapatan Hari Ini")}</p><p className="text-base sm:text-lg lg:text-xl font-bold truncate">{formatCurrency(dashboardData?.overview?.todayRevenue || 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 sm:pt-6"><div className="flex items-center gap-3 sm:gap-4"><div className="p-2.5 sm:p-3 bg-warning/10 rounded-xl shrink-0"><ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-warning" /></div><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Today's Sales", "Penjualan Hari Ini")}</p><p className="text-base sm:text-lg lg:text-xl font-bold truncate">{dashboardData?.overview?.todaySalesCount || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 sm:pt-6"><div className="flex items-center gap-3 sm:gap-4"><div className="p-2.5 sm:p-3 bg-destructive/10 rounded-xl shrink-0"><FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" /></div><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Low Stock Items", "Item Stok Rendah")}</p><p className="text-base sm:text-lg lg:text-xl font-bold truncate">{dashboardData?.overview?.lowStockProducts || 0}</p></div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">{tr("Last 7 Days Revenue", "Pendapatan 7 Hari Terakhir")}</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="h-64 sm:h-72 lg:h-80">
            {overviewChartData && (<Bar data={overviewChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: border + "66" }, ticks: { color: theme.textColor } }, x: { grid: { display: false }, ticks: { color: theme.textColor } } } } as any} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Sales", "Total Penjualan")}</p><p className="text-base sm:text-lg lg:text-xl font-bold">{salesData?.summary?.totalSales || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p><p className="text-base sm:text-lg lg:text-xl font-bold text-primary">{formatCurrency(salesData?.summary?.totalRevenue || 0)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Avg Transaction", "Rata-rata Transaksi")}</p><p className="text-base sm:text-lg lg:text-xl font-bold">{formatCurrency(salesData?.summary?.avgTransaction || 0)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">{tr("Transactions", "Transaksi")}</CardTitle></CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-3 sm:space-y-4">
            {!salesData?.transactions?.length ? (
              <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8 italic">{tr("No transactions found", "Transaksi tidak ditemukan")}</p>
            ) : (
              salesData.transactions.map((t: any) => {
                const isExpanded = expandedItems.has(t._id);
                return (
                  <div key={t._id} className="space-y-3">
                    <div className="p-3 sm:p-4 bg-muted rounded-xl border border-border flex items-center justify-between hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => toggleExpanded(t._id)}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <div className="min-w-0"><p className="font-medium text-foreground text-xs sm:text-sm">{formatDate(t.createdAt)}</p><p className="text-xs sm:text-sm text-muted-foreground">{t.items.length} {tr("items", "item")}</p></div>
                      </div>
                      <div className="text-right shrink-0 ml-2"><p className="text-base sm:text-lg font-bold text-primary">{formatCurrency(t.totalAmount)}</p><p className="text-xs sm:text-sm text-muted-foreground">{tr("Change", "Kembalian")}: {formatCurrency(t.change)}</p></div>
                    </div>
                    {isExpanded && t.items && (
                      <div className="ml-4 sm:ml-6 p-3 sm:p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">{tr("Items Sold", "Barang Dijual")}:</p>
                        <div className="space-y-2.5">
                          {t.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 sm:p-3.5 bg-card rounded-xl border border-border/50">
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="font-medium text-foreground text-xs sm:text-sm truncate">{item.productName}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{item.quantity} x {formatCurrency(item.price)}</p>
                              </div>
                              <p className="font-semibold text-primary text-xs sm:text-sm shrink-0">{formatCurrency(item.subtotal)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfit = () => {
    if (!profitData) return null;
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Revenue", "Total Pendapatan")}</p><p className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">{formatCurrency(profitData.summary.totalRevenue)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Cost", "Total Biaya")}</p><p className="text-base sm:text-lg lg:text-xl font-bold text-destructive truncate">{formatCurrency(profitData.summary.totalPurchaseCost)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Gross Profit", "Laba Kotor")}</p><p className="text-base sm:text-lg lg:text-xl font-bold text-success truncate">{formatCurrency(profitData.summary.grossProfit)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Profit Margin", "Margin Laba")}</p><p className="text-base sm:text-lg lg:text-xl font-bold truncate">{profitData.summary.profitMargin}%</p></CardContent></Card>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">{tr("Financial Overview", "Ringkasan Keuangan")}</CardTitle></CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="h-56 sm:h-64">
                {profitChartData && (<Pie data={profitChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: theme.textColor, padding: 12 } }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } } } } as any} />)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">{tr("Summary", "Ringkasan")}</CardTitle></CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-xl border border-border"><span className="text-xs sm:text-sm">{tr("Revenue", "Pendapatan")}</span><span className="font-bold text-primary text-xs sm:text-sm">{formatCurrency(profitData.summary.totalRevenue)}</span></div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-xl border border-border"><span className="text-xs sm:text-sm">{tr("Cost of Goods", "Biaya Barang")}</span><span className="font-bold text-destructive text-xs sm:text-sm">{formatCurrency(profitData.summary.totalPurchaseCost)}</span></div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-success/10 rounded-xl border border-success/20"><span className="text-xs sm:text-sm">{tr("Gross Profit", "Laba Kotor")}</span><span className="font-bold text-success text-xs sm:text-sm">{formatCurrency(profitData.summary.grossProfit)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading && !dashboardData) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header - Never blurs during refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.reports.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{tr("Financial and performance analytics", "Analitik keuangan dan performa")}</p>
        </div>
        {/* Date Range & Export - Never blurs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{tr("From", "Dari")}:</span>
            <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-full sm:w-36 h-9 sm:h-10 text-xs sm:text-sm" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{tr("To", "Ke")}:</span>
            <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-full sm:w-36 h-9 sm:h-10 text-xs sm:text-sm" />
          </div>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1.5 sm:gap-2 shadow-sm h-9 sm:h-10">
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{tr("Export PDF", "Ekspor PDF")}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Tabs - Never blurs */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-border bg-card/50 p-1 rounded-t-xl overflow-x-auto">
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
            className={`whitespace-nowrap h-8 sm:h-9 ${activeTab === tab.id ? 'shadow-sm' : ''}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content - Blurs during refresh */}
      <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "sales" && renderSales()}
        {activeTab === "purchases" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Purchases", "Total Pembelian")}</p><p className="text-base sm:text-lg lg:text-xl font-bold">{purchasesData?.summary?.totalPurchases || 0}</p></CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6"><p className="text-xs sm:text-sm text-muted-foreground">{tr("Total Spent", "Total Pengeluaran")}</p><p className="text-base sm:text-lg lg:text-xl font-bold text-primary">{formatCurrency(purchasesData?.summary?.totalSpent || 0)}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader className="py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">{tr("Purchase History", "Riwayat Pembelian")}</CardTitle></CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {!purchasesData?.purchases?.length ? (
                    <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8 italic">{tr("No purchases found", "Pembelian tidak ditemukan")}</p>
                  ) : (
                    purchasesData.purchases.map((p: any) => {
                      const isExpanded = expandedItems.has(p._id);
                      return (
                        <div key={p._id} className="space-y-3">
                          <div className="p-3 sm:p-4 bg-muted rounded-xl border border-border flex items-center justify-between hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => toggleExpanded(p._id)}>
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                              <div className="min-w-0"><p className="font-medium text-foreground text-xs sm:text-sm">{p.supplierName}</p><p className="text-xs sm:text-sm text-muted-foreground">{formatDate(p.createdAt)} • {p.items.length} {tr("items", "item")}</p></div>
                            </div>
                            <p className="text-base sm:text-lg font-bold text-primary shrink-0 ml-2">{formatCurrency(p.totalAmount)}</p>
                          </div>
                          {isExpanded && p.items && (
                            <div className="ml-4 sm:ml-6 p-3 sm:p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">{tr("Items Purchased", "Barang Dibeli")}:</p>
                              <div className="space-y-2.5">
                                {p.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-3 sm:p-3.5 bg-card rounded-xl border border-border/50">
                                    <div className="min-w-0 flex-1 pr-3">
                                      <p className="font-medium text-foreground text-xs sm:text-sm truncate">{item.productName}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{item.quantity} x {formatCurrency(item.buyPrice)}</p>
                                    </div>
                                    <p className="font-semibold text-primary text-xs sm:text-sm shrink-0">{formatCurrency(item.subtotal)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
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

function ReportsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton variant="rectangular" className="h-3.5 sm:h-4 w-56 sm:w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Skeleton variant="rectangular" className="h-9 sm:h-10 w-full sm:w-36" />
          <Skeleton variant="rectangular" className="h-9 sm:h-10 w-full sm:w-36" />
          <Skeleton variant="rectangular" className="h-9 sm:h-10 w-24 sm:w-32 ml-auto" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-border p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-8 sm:h-9 w-20 sm:w-24 rounded-xl" />
        ))}
      </div>

      {/* Overview Stats & Charts */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Skeleton variant="rectangular" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <Skeleton variant="rectangular" className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton variant="rectangular" className="h-5 sm:h-6 w-28 sm:w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="py-3 sm:py-4"><Skeleton variant="rectangular" className="h-5 sm:h-6 w-48 sm:w-64" /></CardHeader>
          <CardContent className="p-3 sm:p-4"><Skeleton variant="rectangular" className="h-64 sm:h-72 lg:h-80 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
