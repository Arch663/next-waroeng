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
    primary: "bg-primary/5 border-primary/20",
    success: "bg-success/5 border-success/20",
    warning: "bg-warning/5 border-warning/20",
    destructive: "bg-destructive/5 border-destructive/20",
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
    <div className={cn("rounded-xl border border-border p-4 sm:p-5 transition-all duration-150 hover:bg-muted/30", variants[variant], className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
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
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-2 sm:p-2.5 rounded-lg bg-muted/50 shrink-0", getIconColor())}>
          {icon || <Package className="h-4 w-4 sm:h-5 sm:w-5" />}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";
