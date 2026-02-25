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
      // Logic strictly preserved from original
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/5 flex-col items-center justify-center p-12">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-xl shadow-primary/20 mb-8 animate-bounce-slow">
            <Package className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Waroeng POS
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            {tr(
              "Manage your shop inventory, sales, and reports with our modern Point of Sale system.",
              "Kelola stok, penjualan, dan laporan toko Anda dengan sistem Point of Sale modern."
            )}
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: tr("Real-time Inventory", "Stok Real-time"), icon: "📦" },
              { label: tr("Sales Reports", "Laporan Penjualan"), icon: "📊" },
              { label: tr("Supplier Management", "Kelola Supplier"), icon: "🤝" },
              { label: tr("Multi-user Access", "Akses Multi-user"), icon: "👥" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-background/50 border border-primary/10 backdrop-blur-sm">
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className="text-sm font-semibold text-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[440px]">
          {/* Logo for mobile */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Waroeng</h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
              {tr("Welcome Back", "Selamat Datang")}
            </h1>
            <p className="text-muted-foreground">
              {tr("Enter your credentials to access your dashboard", "Masukkan detail akun untuk mengakses dashboard")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl animate-shake">
              <p className="text-sm text-destructive flex items-center gap-3 font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="h-13 pl-11 rounded-2xl border-muted-foreground/20 focus:border-primary transition-all duration-300"
                />
                <User className="absolute left-4 top-[42px] h-5 w-5 text-muted-foreground" />
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
                  className="h-13 pl-11 pr-12 rounded-2xl border-muted-foreground/20 focus:border-primary transition-all duration-300"
                />
                <Lock className="absolute left-4 top-[42px] h-5 w-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[42px] text-muted-foreground hover:text-foreground transition-colors outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300"
              size="lg"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  {t.auth.signIn}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            <p className="text-sm">
              {tr("Don't have an account?", "Belum punya akun?")}{" "}
              <Link href="/register" className="text-primary hover:underline font-bold transition-all underline-offset-4">
                {tr("Create Account", "Buat Akun")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .h-13 { height: 3.25rem; }
      `}</style>
    </div>
  );
}
