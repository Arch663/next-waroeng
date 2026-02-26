import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn("px-4 sm:px-5 py-3 sm:py-4 border-b border-border", className)}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return (
    <h3 className={cn("text-sm sm:text-base font-semibold text-foreground tracking-tight", className)}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ children, className }) => {
  return (
    <p className={cn("text-xs sm:text-sm text-muted-foreground mt-0.5", className)}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn("px-4 sm:px-5 py-3 sm:py-4", className)}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn("px-4 sm:px-5 py-3 border-t border-border bg-muted/50 rounded-b-xl", className)}>
      {children}
    </div>
  );
};
