"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { Globe, User, Moon, Sun, Languages } from "lucide-react";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);
  const { user } = useAuthStore();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const roleLabel = useMemo(() => {
    if (!user?.role) return "-";
    return user.role;
  }, [user?.role]);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    document.documentElement.classList.toggle("dark", nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
  };

  // Settings is a static page - no loading skeleton needed
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">{t.settings.title}</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {tr(
            "Manage application appearance and your account preferences",
            "Kelola tampilan aplikasi dan preferensi akun Anda"
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              {t.settings.theme}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    {isDarkMode ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {isDarkMode ? t.settings.darkMode : t.settings.lightMode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr("Current color mode", "Mode warna saat ini")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={toggleTheme} className="h-9 sm:h-10">
                  {isDarkMode ? tr("Use Light", "Gunakan Terang") : tr("Use Dark", "Gunakan Gelap")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
              {t.settings.language}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                  language === "en"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm sm:text-base">English</p>
                <p className="text-xs text-muted-foreground">
                  {language === "en" ? tr("Selected", "Dipilih") : tr("Click to select", "Klik untuk pilih")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLanguage("id")}
                className={`rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                  language === "id"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm sm:text-base">Bahasa Indonesia</p>
                <p className="text-xs text-muted-foreground">
                  {language === "id" ? tr("Selected", "Dipilih") : tr("Click to select", "Klik untuk pilih")}
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            {tr("Account Information", "Informasi Akun")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{t.auth.username}</p>
              <p className="mt-1 font-medium text-sm sm:text-base break-all">{user?.username || "-"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{tr("Role", "Role")}</p>
              <p className="mt-1 font-medium text-sm sm:text-base capitalize">{roleLabel}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-1 font-medium text-sm sm:text-base break-all">{user?.email || "-"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{tr("Full Name", "Nama Lengkap")}</p>
              <p className="mt-1 font-medium text-sm sm:text-base">{user?.fullName || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
