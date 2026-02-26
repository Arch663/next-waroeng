"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle, User, Mail, Lock, UserCheck, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { language, t } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!formData.username.trim() || !formData.password) {
      setError(t.auth.required);
      return false;
    }
    if (formData.username.trim().length < 3) {
      setError(tr("Username must be at least 3 characters", "Username minimal 3 karakter"));
      return false;
    }
    if (formData.password.length < 6) {
      setError(tr("Password must be at least 6 characters", "Password minimal 6 karakter"));
      return false;
    }
    if (formData.confirmPassword !== formData.password) {
      setError(tr("Password confirmation does not match", "Konfirmasi password tidak sama"));
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
      const response = await authAPI.register({
        fullName: formData.fullName || undefined,
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
      });
      const { token, user } = response.data.data;

      login(user, token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMessage = tr("Failed to register user", "Gagal mendaftarkan pengguna");

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || t.messages.errorOccurred;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            {tr("Join Waroeng", "Gabung Waroeng")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mb-8 sm:mb-10 leading-relaxed">
            {tr("Empower your business with digital inventory and sales tracking.", "Tingkatkan bisnis Anda dengan pelacakan stok dan penjualan digital.")}
          </p>

          <div className="space-y-2 sm:space-y-3 text-left max-w-xs mx-auto">
            {[
              { text: tr("Setup your shop in minutes", "Siapkan toko dalam hitungan menit"), icon: "⚡" },
              { text: tr("Automated financial summaries", "Ringkasan keuangan otomatis"), icon: "📈" },
              { text: tr("Cloud-based data backup", "Pencadangan data berbasis cloud"), icon: "☁️" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
        <div className="w-full max-w-[380px] sm:max-w-[400px] py-8 sm:py-10">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {tr("Back to Login", "Kembali ke Login")}
          </Link>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              {tr("Create Account", "Buat Akun")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tr("Start managing your shop today.", "Mulai kelola toko Anda sekarang.")}
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

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Input
                label={tr("Full Name", "Nama Lengkap")}
                placeholder={tr("Enter your full name", "Masukkan nama lengkap")}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                className="h-11 pl-10 rounded-lg"
              />
              <UserCheck className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={t.auth.username}
                placeholder={tr("Enter your username", "Masukkan username")}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                className="h-11 pl-10 rounded-lg"
                required
              />
              <User className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={tr("Email", "Email")}
                type="email"
                placeholder={tr("Enter your email (optional)", "Masukkan email (opsional)")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                className="h-11 pl-10 rounded-lg"
              />
              <Mail className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                placeholder={tr("Enter your password", "Masukkan password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="h-11 pl-10 pr-10 rounded-lg"
                required
              />
              <Lock className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label={tr("Confirm Password", "Konfirmasi Password")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={tr("Re-enter your password", "Masukkan ulang password")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                className="h-11 pl-10 pr-10 rounded-lg"
                required
              />
              <Lock className="absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-lg mt-2 active:scale-[0.98] transition-all"
              size="md"
              isLoading={isLoading}
            >
              {isLoading ? t.common.loading : tr("Daftar Sekarang", "Create Account")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6 sm:mt-8">
            {tr("Already have an account?", "Sudah punya akun?")}{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold transition-all underline-offset-4">
              {t.auth.signIn}
            </Link>
          </p>
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
