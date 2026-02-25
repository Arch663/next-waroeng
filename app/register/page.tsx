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
    // Logic strictly preserved from original
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
      // Logic strictly preserved from original
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/5 flex-col items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-xl shadow-primary/20 mb-8 animate-bounce-slow">
            <Package className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {tr("Join Waroeng", "Gabung Waroeng")}
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-10 leading-relaxed">
            {tr("Empower your business with digital inventory and sales tracking.", "Tingkatkan bisnis Anda dengan pelacakan stok dan penjualan digital.")}
          </p>

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              { text: tr("Setup your shop in minutes", "Siapkan toko dalam hitungan menit"), icon: "⚡" },
              { text: tr("Automated financial summaries", "Ringkasan keuangan otomatis"), icon: "📈" },
              { text: tr("Cloud-based data backup", "Pencadangan data berbasis cloud"), icon: "☁️" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-primary/5 backdrop-blur-sm">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto max-h-screen">
        <div className="w-full max-w-[440px] py-10">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-10 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {tr("Back to Login", "Kembali ke Login")}
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
              {tr("Create Account", "Buat Akun")}
            </h1>
            <p className="text-muted-foreground">
              {tr("Start managing your shop today.", "Mulai kelola toko Anda sekarang.")}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label={tr("Full Name", "Nama Lengkap")}
                placeholder={tr("Enter your full name", "Masukkan nama lengkap")}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                className="h-12 pl-11 rounded-xl"
              />
              <UserCheck className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={t.auth.username}
                placeholder={tr("Enter your username", "Masukkan username")}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                className="h-12 pl-11 rounded-xl"
                required
              />
              <User className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={tr("Email", "Email")}
                type="email"
                placeholder={tr("Enter your email (optional)", "Masukkan email (opsional)")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                className="h-12 pl-11 rounded-xl"
              />
              <Mail className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                placeholder={tr("Enter your password", "Masukkan password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="h-12 pl-11 pr-11 rounded-xl"
                required
              />
              <Lock className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
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
                className="h-12 pl-11 pr-11 rounded-xl"
                required
              />
              <Lock className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all"
              size="lg"
              isLoading={isLoading}
            >
              {isLoading ? t.common.loading : tr("Daftar Sekarang", "Create Account")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-8">
            {tr("Already have an account?", "Sudah punya akun?")}{" "}
            <Link href="/login" className="text-primary hover:underline font-bold transition-all underline-offset-4">
              {t.auth.signIn}
            </Link>
          </p>
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
      `}</style>
    </div>
  );
}
