"use client";

import { useState, type ReactNode } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "solid" | "glass";
  confirmIcon?: ReactNode;
  isLoading?: boolean;
  maxWidth?: "sm" | "md" | "lg";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  icon,
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "danger",
  confirmIcon,
  isLoading: controlledLoading,
  maxWidth = "md",
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = controlledLoading ?? internalLoading;

  const handleConfirm = async () => {
    if (loading) return;
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const confirmBtnClasses =
    confirmVariant === "danger"
      ? "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs"
      : confirmVariant === "solid"
      ? "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs"
      : "";

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      icon={icon}
      title={title}
      subtitle={subtitle}
      isDismissable={!loading}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={loading}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            variant={confirmVariant === "glass" ? "glass" : undefined}
            isDisabled={loading}
            onPress={handleConfirm}
            className={`${confirmBtnClasses} flex items-center gap-1.5 cursor-pointer`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              confirmIcon
            )}
            <span>{confirmText}</span>
          </Button>
        </div>
      }
    >
      {children}
    </GlassModal>
  );
}
