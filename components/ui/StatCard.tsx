import React from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  icon,
  trend,
  variant = "default",
  className,
}) => {
  const variants = {
    default: "bg-card",
    primary: "bg-primary/12 border-primary/35",
    success: "bg-success/12 border-success/35",
    warning: "bg-warning/12 border-warning/35",
    destructive: "bg-destructive/12 border-destructive/35",
  };

  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return "text-primary";
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "destructive":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border p-6 shadow-sm transition-all duration-200 hover:shadow-md", variants[variant], className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {typeof value === "number" && value > 1000 ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span> 
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl bg-card/70", getIconColor())}>
          {icon || <Package className="h-6 w-6" />}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";
