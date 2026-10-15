"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Radio, X, Info, Loader2 } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "emit";

export interface ToastAction {
  label: string;
  onClick: () => Promise<void> | void;
  loadingLabel?: string;
  loadingMessage?: string;
  successMessage?: string;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  isLoading?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    setMounted(true);
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success", options?: ToastOptions) => {
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);

      const timeoutMs = options?.duration ?? (options?.action ? 6000 : 4000);
      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, timeoutMs);
    },
    [removeToast]
  );

  const handleActionClick = async (t: ToastItem) => {
    if (!t.action || t.isLoading) return;

    if (timersRef.current[t.id]) {
      clearTimeout(timersRef.current[t.id]);
      delete timersRef.current[t.id];
    }

    const action = t.action;

    setToasts((prev) =>
      prev.map((item) =>
        item.id === t.id
          ? {
              ...item,
              isLoading: true,
              message: action.loadingMessage || item.message,
            }
          : item
      )
    );

    try {
      await action.onClick();
      setToasts((prev) =>
        prev.map((item) =>
          item.id === t.id
            ? {
                ...item,
                isLoading: false,
                type: "success",
                action: undefined,
                message: action.successMessage || "Acción completada con éxito.",
              }
            : item
        )
      );
      timersRef.current[t.id] = setTimeout(() => {
        removeToast(t.id);
      }, 2000);
    } catch (err: any) {
      console.error("[Toast action error]:", err);
      setToasts((prev) =>
        prev.map((item) =>
          item.id === t.id
            ? {
                ...item,
                isLoading: false,
                type: "error",
                action: undefined,
                message: err?.message || "Ocurrió un error al realizar la acción.",
              }
            : item
        )
      );
      timersRef.current[t.id] = setTimeout(() => {
        removeToast(t.id);
      }, 4000);
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toasts Container (Top-Right, sobre todos los modales z-[99999]) */}
      {mounted &&
        createPortal(
          <div className="fixed top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => {
              let icon = <CheckCircle2 size={16} className="text-[#1ed760] shrink-0" />;
              let accentClass = "border-emerald-500/30 dark:border-emerald-400/30 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.08]";

              if (t.isLoading) {
                icon = <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />;
                accentClass = "border-purple-500/35 dark:border-purple-400/35 bg-purple-500/[0.08] dark:bg-purple-500/[0.08]";
              } else if (t.type === "error") {
                icon = <AlertCircle size={16} className="text-rose-400 shrink-0" />;
                accentClass = "border-rose-500/30 dark:border-rose-400/30 bg-rose-500/[0.08] dark:bg-rose-500/[0.08]";
              } else if (t.type === "info") {
                icon = <Info size={16} className="text-sky-400 shrink-0" />;
                accentClass = "border-sky-500/30 dark:border-sky-400/30 bg-sky-500/[0.08] dark:bg-sky-500/[0.08]";
              } else if (t.type === "emit") {
                icon = <Radio size={16} className="text-purple-400 shrink-0" />;
                accentClass = "border-purple-500/35 dark:border-purple-400/35 bg-purple-500/[0.08] dark:bg-purple-500/[0.08]";
              }

              return (
                <div
                  key={t.id}
                  className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl [box-shadow:0_20px_45px_-10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] bg-white/80 dark:bg-[#12151f]/70 text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-200 transition-all ${accentClass}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {icon}
                    <span className="font-medium leading-relaxed break-words">{t.message}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.action && (
                      <button
                        onClick={() => handleActionClick(t)}
                        disabled={t.isLoading}
                        className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors flex items-center gap-1.5 ${
                          t.isLoading
                            ? "bg-purple-600/20 border-purple-500/30 text-purple-300 opacity-80 cursor-wait"
                            : "bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/40 text-purple-200 hover:text-white cursor-pointer"
                        }`}
                      >
                        {t.isLoading ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-purple-300" />
                            <span>{t.action.loadingLabel || "Deshaciendo..."}</span>
                          </>
                        ) : (
                          <span>{t.action.label}</span>
                        )}
                      </button>
                    )}
                    {!t.isLoading && (
                      <button
                        onClick={() => removeToast(t.id)}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback si no está dentro de ToastProvider
    return {
      toast: (msg: string) => {
        console.log("[Toast fallback]:", msg);
      },
    };
  }
  return context;
}
