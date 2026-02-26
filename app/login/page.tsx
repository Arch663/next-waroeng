"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle, User, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t, language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError(t.auth.required);
      return false;
    }
    if (!formData.password) {
      setError(t.auth.required);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(formData.username, formData.password);
      const { token, user } = response.data.data;

      login(user, token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMessage = t.auth.invalidCredentials;

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || t.auth.invalidCredentials;
      } else if (err instanceof Error) {
        errorMessage = err.message || t.messages.errorOccurred;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel: Brand & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted/30 flex-col items-center justify-center p-8 xl:p-12">
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-primary mb-6 sm:mb-8">
            <Package className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-foreground">
            Waroeng POS
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8 sm:mb-10">
            {tr(
              "Manage your shop inventory, sales, and reports with our modern Point of Sale system.",
              "Kelola stok, penjualan, dan laporan toko Anda dengan sistem Point of Sale modern."
            )}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-left">
            {[
              { label: tr("Real-time Inventory", "Stok Real-time"), icon: "📦" },
              { label: tr("Sales Reports", "Laporan Penjualan"), icon: "📊" },
              { label: tr("Supplier Management", "Kelola Supplier"), icon: "🤝" },
              { label: tr("Multi-user Access", "Akses Multi-user"), icon: "👥" },
            ].map((item, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
                <span className="text-lg sm:text-xl mb-1 sm:mb-2 block">{item.icon}</span>
                <span className="text-xs sm:text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-[380px] sm:max-w-[400px]">
          {/* Logo for mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8 sm:mb-10">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Waroeng</h2>
          </div>

          <div className="mb-8 sm:mb-10 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              {tr("Welcome Back", "Selamat Datang")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tr("Enter your credentials to access your dashboard", "Masukkan detail akun untuk mengakses dashboard")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-destructive/5 border border-destructive/20 rounded-lg animate-shake">
              <p className="text-sm text-destructive flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  label={t.auth.username}
                  placeholder={tr("Enter your username", "Masukkan username")}
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    handleInputChange();
                  }}
                  disabled={isLoading}
                  className="h-11 pl-10 rounded-lg"
                />
                <User className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="relative">
                <Input
                  label={t.auth.password}
                  type={showPassword ? "text" : "password"}
                  placeholder={tr("Enter your password", "Masukkan password")}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    handleInputChange();
                  }}
                  disabled={isLoading}
                  className="h-11 pl-10 pr-10 rounded-lg"
                />
                <Lock className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-lg active:scale-[0.98] transition-all"
              size="md"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  {t.auth.signIn}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            <p className="text-sm">
              {tr("Don't have an account?", "Belum punya akun?")}{" "}
              <Link href="/register" className="text-primary hover:underline font-semibold transition-all underline-offset-4">
                {tr("Create Account", "Buat Akun")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
