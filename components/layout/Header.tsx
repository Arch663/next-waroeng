"use client";

import React from "react";
import { useUIStore, useAuthStore } from "@/lib/store";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Menu, Sun, Moon, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header: React.FC = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { language } = useLanguage();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-16 bg-card border-b border-border",
        "flex items-center justify-between px-4",
        "transition-all duration-200 ease-in-out"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger Menu for Mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-9 w-9 p-0 rounded-lg lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Collapse/Expand Button for Desktop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-9 w-9 p-0 rounded-lg hidden lg:flex"
        >
          {sidebarOpen ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </Button>

        <h1 className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">
          Waroeng POS
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 rounded-lg"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-xs hidden sm:inline-block">
            {user?.username || (language === "id" ? "Pengguna" : "User")}
          </span>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
