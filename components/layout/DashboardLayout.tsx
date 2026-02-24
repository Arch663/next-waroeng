"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useUIStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LowStockAlert } from "@/components/layout/LowStockAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        router.push("/login");
        return;
      }

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      setSidebarOpen(isDesktop);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, setSidebarOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton variant="circular" width={48} height={48} />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
          "ml-0 lg:ml-64",
          !sidebarOpen && "lg:ml-20"
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <LowStockAlert />
    </div>
  );
};
