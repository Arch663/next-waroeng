"use client";

import { useState, useEffect } from "react";

interface ChartTheme {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  border: string;
  textColor: string;
  gridColor: string;
}

const getCssVar = (name: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const readTheme = (): ChartTheme => ({
  c1: getCssVar("--chart-1", "#d6452b"),
  c2: getCssVar("--chart-2", "#ef7b45"),
  c3: getCssVar("--chart-3", "#e18a19"),
  c4: getCssVar("--chart-4", "#3f8c4f"),
  c5: getCssVar("--chart-5", "#a61e1e"),
  border: getCssVar("--border", "#f0c8bb"),
  textColor: getCssVar("--muted-foreground", "#8d6057"),
  gridColor: getCssVar("--border", "#f0c8bb"),
});

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(readTheme);

  useEffect(() => {
    // Read initial theme
    setTheme(readTheme());

    // Watch for dark/light class changes on <html>
    const observer = new MutationObserver(() => {
      // Small timeout to let CSS variables settle after class change
      setTimeout(() => {
        setTheme(readTheme());
      }, 30);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
