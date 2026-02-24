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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {tr(
            "Manage application appearance and your account preferences",
            "Kelola tampilan aplikasi dan preferensi akun Anda"
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t.settings.theme}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isDarkMode ? t.settings.darkMode : t.settings.lightMode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tr("Current color mode", "Mode warna saat ini")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {isDarkMode ? tr("Use Light", "Gunakan Terang") : tr("Use Dark", "Gunakan Gelap")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t.settings.language}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  language === "en"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-semibold">English</p>
                <p className="text-xs text-muted-foreground">
                  {language === "en" ? tr("Selected", "Dipilih") : tr("Click to select", "Klik untuk pilih")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLanguage("id")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  language === "id"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-semibold">Bahasa Indonesia</p>
                <p className="text-xs text-muted-foreground">
                  {language === "id" ? tr("Selected", "Dipilih") : tr("Click to select", "Klik untuk pilih")}
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {tr("Account Information", "Informasi Akun")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{t.auth.username}</p>
              <p className="mt-1 font-medium">{user?.username || "-"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{tr("Role", "Role")}</p>
              <p className="mt-1 font-medium capitalize">{roleLabel}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-1 font-medium break-all">{user?.email || "-"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{tr("Full Name", "Nama Lengkap")}</p>
              <p className="mt-1 font-medium">{user?.fullName || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
