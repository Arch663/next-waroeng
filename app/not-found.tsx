"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function NotFound() {
  const { language } = useLanguage();
  const tr = (en: string, id: string) => (language === "id" ? id : en);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <section className="w-full rounded-3xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm sm:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            404
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {tr("Page not found", "Halaman tidak ditemukan")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tr(
              "The page you are looking for does not exist or has been moved.",
              "Halaman yang Anda cari tidak tersedia atau sudah dipindahkan."
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tr("Back to Dashboard", "Kembali ke Dashboard")}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">{tr("Browse Products", "Lihat Produk")}</Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

