import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = "text", ...props }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === "number") {
        e.currentTarget.select();
      }
      props.onFocus?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            onFocus={handleFocus}
            className={cn(
              "w-full px-4 py-2.5 bg-background/65 backdrop-blur-sm border border-input rounded-xl text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring/70 focus:border-transparent focus:ring-offset-1 focus:ring-offset-background",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              icon && "pl-10",
              error && "border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
