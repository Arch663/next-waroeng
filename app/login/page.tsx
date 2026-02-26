"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle, User, Lock, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

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
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Floating Gradient Orbs */}
      <div className="fixed top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative w-full max-w-7xl mx-auto flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left: Brand Section */}
          <div className="hidden lg:block space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/5 border border-primary/10">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-foreground">{tr("Trusted by 1000+ businesses", "Dipercaya oleh 1000+ bisnis")}</span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                {tr("Simplify Your", "Sederhanakan")}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  {tr("Business Management", "Bisnis Anda")}
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-md leading-relaxed">
                {tr(
                  "All-in-one POS system for inventory, sales, and financial tracking.",
                  "Sistem POS terpadu untuk inventaris, penjualan, dan pelacakan keuangan."
                )}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Zap, label: tr("Fast & Reliable", "Cepat & Andal"), desc: tr("Lightning fast performance", "Performa sangat cepat") },
                { icon: Shield, label: tr("Secure", "Aman"), desc: tr("Bank-level encryption", "Enkripsi tingkat bank") },
              ].map((item, i) => (
                <div key={i} className="group p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-xs sm:text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* App Preview Card */}
            <div className="relative mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-primary/20" />
                  <div className="h-3 w-1/2 rounded-full bg-primary/15" />
                  <div className="h-20 rounded-xl bg-primary/10 mt-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              {/* Card with glassmorphism effect */}
              <div className="relative backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl shadow-primary/5">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-3 sm:mb-4 shadow-lg shadow-primary/20">
                    <Package className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2">
                    {tr("Welcome Back", "Selamat Datang")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tr("Sign in to continue", "Masuk untuk melanjutkan")}
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-destructive/5 border border-destructive/20 rounded-xl animate-shake">
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      {error}
                    </p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {t.auth.username}
                    </label>
                    <div className="relative">
                      <Input
                        placeholder={tr("Enter username", "Masukkan username")}
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value });
                          handleInputChange();
                        }}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                      />
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {t.auth.password}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={tr("Enter password", "Masukkan password")}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          handleInputChange();
                        }}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 pr-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 bg-gradient-to-r from-primary to-primary/90"
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

                {/* Footer */}
                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border/50 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tr("Don't have an account?", "Belum punya akun?")}{" "}
                    <Link href="/register" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                      {tr("Create Account", "Buat Akun")}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-3 -left-3 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl pointer-events-none" />
            </div>
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
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
