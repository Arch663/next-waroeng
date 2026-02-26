"use client";

import React from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: "success" | "warning" | "error" | "info";
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
}) => {
  const { t } = useLanguage();
  const config = {
    success: {
      icon: CheckCircle2,
      iconClass: "text-success",
      bgClass: "bg-success/10",
    },
    warning: {
      icon: TriangleAlert,
      iconClass: "text-warning",
      bgClass: "bg-warning/10",
    },
    error: {
      icon: TriangleAlert,
      iconClass: "text-destructive",
      bgClass: "bg-destructive/10",
    },
    info: {
      icon: Info,
      iconClass: "text-primary",
      bgClass: "bg-primary/10",
    },
  };

  const Icon = config[variant].icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t.common.confirm} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-lg p-2 shrink-0", config[variant].bgClass)}>
            <Icon className={cn("h-5 w-5", config[variant].iconClass)} />
          </div>
          <p className="text-sm leading-relaxed text-foreground break-words">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="min-w-20 h-10">
            <X className="mr-2 h-4 w-4" />
            {t.common.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
