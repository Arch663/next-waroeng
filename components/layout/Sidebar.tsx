"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore, useAuthStore } from "@/lib/store";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ShoppingCart,
  Users,
  FileText,
  Tags,
  LogOut,
  X,
  Settings,
  ShieldCheck,
} from "lucide-react";

export const Sidebar: React.FC = React.memo(function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const { t, language } = useLanguage();

  const navigation = useMemo(() => {
    const baseNav = [
      { name: t.dashboard.title, href: "/dashboard", icon: LayoutDashboard },
    ];

    if (user?.role === 'admin' || user?.role === 'manager') {
      baseNav.push(
        { name: language === "id" ? "Pengguna" : "Users", href: "/users", icon: ShieldCheck },
        { name: language === "id" ? "Kategori" : "Categories", href: "/categories", icon: Tags },
        { name: t.inventory.title, href: "/inventory", icon: ClipboardList },
        { name: t.suppliers.title, href: "/suppliers", icon: Users },
        { name: t.purchases.title, href: "/purchases", icon: FileText },
        { name: t.reports.title, href: "/reports", icon: FileText },
      );
    }
    baseNav.push({ name: t.products.title, href: "/products", icon: Package });
    baseNav.push({ name: t.cashier.title, href: "/checkout", icon: ShoppingCart });
    baseNav.push({ name: t.common.settings, href: "/settings", icon: Settings })

    return baseNav;
  }, [language, t, user?.role]);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar (Drawer) */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border lg:hidden",
          "transform transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm sm:text-base text-foreground tracking-tight">Waroeng</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-2 sm:p-3 border-t border-border">
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-destructive hover:bg-muted transition-all duration-150"
              )}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
              }}
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="font-medium text-sm">{t.common.logout}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar (Collapsed/Expanded) */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full bg-card border-r border-border hidden lg:flex transition-all duration-200 ease-in-out",
          sidebarOpen ? "w-56 sm:w-60" : "w-16"
        )}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo */}
          <div className="h-14 sm:h-16 flex items-center justify-center border-b border-border">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="ml-2.5 sm:ml-3 font-semibold text-sm sm:text-base text-foreground tracking-tight whitespace-nowrap">Waroeng</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 sm:py-4 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-150",
                    sidebarOpen ? "justify-start" : "justify-center",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-border">
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-destructive hover:bg-muted transition-all duration-150",
                sidebarOpen ? "justify-start" : "justify-center"
              )}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
              }}
              title={!sidebarOpen ? t.common.logout : undefined}
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              {sidebarOpen && <span className="font-medium text-sm">{t.common.logout}</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
});
