"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle, User, Mail, Lock, UserCheck, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Floating Gradient Orbs */}
      <div className="fixed top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative w-full max-w-7xl mx-auto flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left: Features Section */}
          <div className="hidden lg:block space-y-6 lg:space-y-8">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {tr("Back to Login", "Kembali ke Login")}
            </Link>

            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/5 border border-primary/10">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-foreground">{tr("Start your journey", "Mulai perjalanan Anda")}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                {tr("Create Your", "Buat")}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  {tr("Free Account", "Akun Gratis")}
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-md leading-relaxed">
                {tr(
                  "Join thousands of businesses managing their operations smarter.",
                  "Bergabung dengan ribuan bisnis yang mengelola operasi mereka lebih cerdas."
                )}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 sm:space-y-4">
              {[
                { title: tr("Quick Setup", "Setup Cepat"), desc: tr("Get started in minutes", "Mulai dalam hitungan menit") },
                { title: tr("Smart Analytics", "Analitik Cerdas"), desc: tr("Track performance easily", "Pantau performa dengan mudah") },
                { title: tr("24/7 Support", "Dukungan 24/7"), desc: tr("We're here to help", "Kami siap membantu") },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs sm:text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
              {[
                { value: "1000+", label: tr("Businesses", "Bisnis") },
                { value: "99.9%", label: tr("Uptime", "Uptime") },
                { value: "24/7", label: tr("Support", "Dukungan") },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/10">
                  <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Register Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              {/* Card with glassmorphism effect */}
              <div className="relative backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl shadow-primary/5">
                {/* Header */}
                <div className="text-center mb-5 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-3 sm:mb-4 shadow-lg shadow-primary/20">
                    <Package className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2">
                    {tr("Get Started", "Mulai Sekarang")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tr("Create account to continue", "Buat akun untuk melanjutkan")}
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/5 border border-destructive/20 rounded-xl animate-shake">
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      {error}
                    </p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {tr("Full Name", "Nama Lengkap")}
                    </label>
                    <div className="relative">
                      <Input
                        placeholder={tr("Enter full name", "Masukkan nama lengkap")}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                      />
                      <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {t.auth.username}
                    </label>
                    <div className="relative">
                      <Input
                        placeholder={tr("Enter username", "Masukkan username")}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                        required
                      />
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {tr("Email", "Email")}
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder={tr("Enter email (optional)", "Masukkan email (opsional)")}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 pr-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                        required
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

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-foreground ml-1">
                      {tr("Confirm Password", "Konfirmasi Password")}
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={tr("Re-enter password", "Masukkan ulang password")}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 pl-11 pr-11 rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-sm sm:text-base"
                        required
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 mt-2"
                    size="md"
                    isLoading={isLoading}
                  >
                    {isLoading ? t.common.loading : tr("Create Account", "Buat Akun")}
                  </Button>
                </form>

                {/* Footer */}
                <div className="mt-5 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tr("Already have an account?", "Sudah punya akun?")}{" "}
                    <Link href="/login" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                      {t.auth.signIn}
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
