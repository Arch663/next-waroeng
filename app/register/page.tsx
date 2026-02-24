"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Waroeng</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {tr("Create a new account", "Buat akun baru")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={tr("Full Name", "Nama Lengkap")}
              placeholder={tr("Enter your full name", "Masukkan nama lengkap")}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isLoading}
              className="h-12"
            />

            <Input
              label={t.auth.username}
              placeholder={tr("Enter your username", "Masukkan username")}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              className="h-12"
              required
            />

            <Input
              label={tr("Email", "Email")}
              type="email"
              placeholder={tr("Enter your email (optional)", "Masukkan email (opsional)")}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              className="h-12"
            />

            <div className="relative">
              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                placeholder={tr("Enter your password", "Masukkan password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                className="h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              size="lg"
              isLoading={isLoading}
            >
              {isLoading ? t.common.loading : tr("Create Account", "Buat Akun")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {tr("Already have an account?", "Sudah punya akun?")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t.auth.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
