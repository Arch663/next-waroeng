"use client";

import React, { useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { storeAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { usePageData } from "@/lib/usePageData";
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Calendar, Filter, ShoppingCart, RefreshCw } from "lucide-react";

interface BalanceData {
  balance: number;
  lastUpdated: string;
}

interface HistoryItem {
  _id: string;
  type: 'deposit' | 'withdraw' | 'sale' | 'purchase';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface HistoryResponse {
  transactions: HistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function BalanceContent() {
  const { t, language } = useLanguage();
  const tr = useCallback((en: string, id: string) => (language === "id" ? id : en), [language]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositDesc, setDepositDesc] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");

  const { data, isLoading: isLoadingData, isRefreshing, refetch } = usePageData<BalanceData>({
    key: "store-balance",
    fetchFn: async () => {
      const response = await storeAPI.getBalance();
      return response.data.data as BalanceData;
    },
  });

  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = usePageData<HistoryResponse>({
    key: "balance-history",
    fetchFn: async () => {
      const params: any = { page: 1, limit: 20 };
      if (filterType) params.type = filterType;
      const response = await storeAPI.getHistory(params);
      return response.data.data as HistoryResponse;
    },
  });

  const handleDeposit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(tr("Jumlah harus lebih dari 0", "Amount must be greater than 0"));
      }

      await storeAPI.deposit({ amount, description: depositDesc || undefined });
      setSuccess(tr("Deposit berhasil", "Deposit successful"));
      setDepositAmount("");
      setDepositDesc("");
      refetch(true);
      refetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || tr("Error processing deposit", "Error processing deposit"));
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, [depositAmount, depositDesc, refetch, refetchHistory, tr]);

  const handleWithdraw = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(tr("Jumlah harus lebih dari 0", "Amount must be greater than 0"));
      }

      if (data && amount > data.balance) {
        throw new Error(tr("Saldo tidak mencukupi", "Insufficient balance"));
      }

      await storeAPI.withdraw({ amount, description: withdrawDesc || undefined });
      setSuccess(tr("Penarikan berhasil", "Withdrawal successful"));
      setWithdrawAmount("");
      setWithdrawDesc("");
      refetch(true);
      refetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || tr("Error processing withdrawal", "Error processing withdrawal"));
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, [withdrawAmount, withdrawDesc, data, refetch, refetchHistory, tr]);

  const getTypeLabel = useCallback((type: string) => {
    const labels: Record<string, { en: string; id: string }> = {
      deposit: { en: "Deposit", id: "Deposit" },
      withdraw: { en: "Withdrawal", id: "Penarikan" },
      sale: { en: "Sale", id: "Penjualan" },
      purchase: { en: "Purchase", id: "Pembelian" },
    };
    return labels[type]?.[language === "id" ? "id" : "en"] || type;
  }, [language]);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4" />;
      case "withdraw":
        return <TrendingDown className="h-4 w-4" />;
      case "sale":
        return <DollarSign className="h-4 w-4" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      deposit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      withdraw: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      sale: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      purchase: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[type] || colors.purchase;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString(language === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [language]);

  // Show skeleton on initial load
  if (isLoadingData && !data) {
    return <BalanceSkeleton />;
  }

  const isRefreshingUI = isRefreshing || isLoadingHistory;

  return (
    <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isRefreshingUI ? 'opacity-60' : 'opacity-100'}`}>
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
            {tr("Saldo", "Store Balance")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tr("Kelola saldo toko Anda, lihat riwayat transaksi", "Manage your store balance, view transaction history")}
          </p>
        </div>
      </div>

      {/* Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {tr("Saldo Saat Ini", "Current Balance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(data?.balance || 0)}
            </div>
            {data?.lastUpdated && (
              <p className="text-sm text-muted-foreground">
                {tr("Terakhir diperbarui", "Last updated")}: {formatDate(data.lastUpdated)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Deposit and Withdraw Forms */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Plus className="h-5 w-5" />
              {tr("Deposit Saldo", "Deposit Funds")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tr("Jumlah Deposit", "Deposit Amount")}
                </label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tr("Deskripsi (Opsional)", "Description (Optional)")}
                </label>
                <Input
                  type="text"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  placeholder={tr("Contoh: Setoran tunai", "e.g., Cash deposit")}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? tr("Memproses...", "Processing...") : tr("Deposit", "Deposit")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdraw Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Minus className="h-5 w-5" />
              {tr("Tarik Saldo", "Withdraw Funds")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tr("Jumlah Penarikan", "Withdrawal Amount")}
                </label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  max={data?.balance}
                  required
                  disabled={isLoading}
                />
                {data && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tr("Maksimal:", "Maximum:")} {formatCurrency(data.balance)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tr("Deskripsi (Opsional)", "Description (Optional)")}
                </label>
                <Input
                  type="text"
                  value={withdrawDesc}
                  onChange={(e) => setWithdrawDesc(e.target.value)}
                  placeholder={tr("Contoh: Biaya operasional", "e.g., Operational costs")}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? tr("Memproses...", "Processing...") : tr("Tarik", "Withdraw")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Balance History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {tr("Riwayat Transaksi Saldo", "Balance Transaction History")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-border rounded-md px-2 py-1 bg-background"
              >
                <option value="">
                  {tr("Semua Tipe", "All Types")}
                </option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">{tr("Penarikan", "Withdrawal")}</option>
                <option value="sale">{tr("Penjualan", "Sale")}</option>
                <option value="purchase">{tr("Pembelian", "Purchase")}</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType("");
                  refetchHistory();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : historyData?.transactions && historyData.transactions.length > 0 ? (
            <div className="space-y-2">
              {historyData.transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getTypeLabel(tx.type)}</span>
                        {tx.description && (
                          <span className="text-xs text-muted-foreground">
                            {tx.description}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${tx.type === "deposit" || tx.type === "sale"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      }`}>
                      {tx.type === "deposit" || tx.type === "sale" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tr("Saldo:", "Balance:")} {formatCurrency(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tr("Belum ada riwayat transaksi", "No transaction history yet")}</p>
            </div>
          )}

          {/* Pagination Info */}
          {historyData && historyData.pagination && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
              {tr("Menampilkan", "Showing")} {historyData.transactions.length} {tr("dari", "of")} {historyData.pagination.total} {tr("transaksi", "transactions")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <Skeleton variant="rectangular" className="h-8 w-48" />
        <Skeleton variant="rectangular" className="h-4 w-64" />
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <Skeleton variant="rectangular" className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton variant="rectangular" className="h-12 w-48" />
            <Skeleton variant="rectangular" className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Deposit & Withdraw Forms */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton variant="rectangular" className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton variant="rectangular" className="h-10 w-full" />
            <Skeleton variant="rectangular" className="h-10 w-full" />
            <Skeleton variant="rectangular" className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton variant="rectangular" className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton variant="rectangular" className="h-10 w-full" />
            <Skeleton variant="rectangular" className="h-10 w-full" />
            <Skeleton variant="rectangular" className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* History Card */}
      <Card>
        <CardHeader>
          <Skeleton variant="rectangular" className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded">
                <Skeleton variant="circular" className="h-8 w-8" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="rectangular" className="h-4 w-24" />
                  <Skeleton variant="rectangular" className="h-3 w-32" />
                </div>
                <Skeleton variant="rectangular" className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BalancePage() {
  return (
    <Suspense fallback={<BalanceSkeleton />}>
      <BalanceContent />
    </Suspense>
  );
}
