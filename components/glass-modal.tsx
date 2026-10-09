"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@heroui/react";
import { X } from "lucide-react";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  isDismissable?: boolean;
}

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function GlassModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "md",
  className = "",
  isDismissable = true,
}: GlassModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isDismissable) {
      onClose();
    }
  }, [isDismissable, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDismissable) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDismissable, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 glass-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <div
          className={`w-full ${MAX_WIDTH_MAP[maxWidth]} max-h-[calc(100dvh-3rem)] my-auto shrink-0 glass-modal-panel glass-modal-enter p-6 sm:p-7 flex flex-col pointer-events-auto relative shadow-2xl ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {isDismissable && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Cerrar ventana"
              className="absolute top-4 right-4 h-8 w-8 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 shrink-0 z-20"
              onPress={handleClose}
            >
              <X size={17} />
            </Button>
          )}

          {/* Header */}
          {title && (
            <div className="flex items-start gap-3 border-b border-black/5 dark:border-white/10 pb-4 mb-4 pr-7">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 -mr-1 text-sm">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-black/5 dark:border-white/10 pt-4 mt-4 flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
