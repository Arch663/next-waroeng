"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  variant = "danger",
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const variants = {
    danger: {
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      confirmButton: "bg-destructive hover:bg-destructive-hover text-white",
    },
    warning: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      confirmButton: "bg-warning hover:bg-warning/90 text-white",
    },
    info: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      confirmButton: "bg-primary hover:bg-primary-hover text-primary-foreground",
    },
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-50 w-full max-w-md bg-card rounded-2xl shadow-xl border border-border",
          "animate-in fade-in zoom-in duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-full", variants[variant].iconBg)}>
              <AlertTriangle className={cn("h-6 w-6", variants[variant].iconColor)} />
            </div>
            <div className="flex-1">
              <p className="text-foreground">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isLoading}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant={variant === "danger" ? "destructive" : variant === "warning" ? "primary" : "primary"}
              className="flex-1 rounded-xl"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {variant === "danger" ? t.common.delete : t.common.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
