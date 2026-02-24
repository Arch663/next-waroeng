"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Eye, EyeOff, AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Waroeng</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Shop Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t.auth.username}
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                handleInputChange();
              }}
              disabled={isLoading}
              className="h-12"
            />

            <div className="relative">
              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  handleInputChange();
                }}
                disabled={isLoading}
                className="h-12 pr-12"
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
              {isLoading ? t.common.loading : t.auth.signIn}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {tr("Don't have an account?", "Belum punya akun?")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {tr("Register", "Daftar")}
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo Credentials
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <code className="px-3 py-1.5 bg-muted rounded-md text-muted-foreground">
                admin
              </code>
              <span className="text-muted-foreground">/</span>
              <code className="px-3 py-1.5 bg-muted rounded-md text-muted-foreground">
                admin123
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 Waroeng. All rights reserved.
        </p>
      </div>
    </div>
  );
}
