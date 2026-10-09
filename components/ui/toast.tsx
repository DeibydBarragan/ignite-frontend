"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Radio, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "emit";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed bottom-24 right-5 sm:right-8 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let icon = <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
          let borderClass = "border-emerald-500/20 bg-slate-900/90 text-white";

          if (t.type === "error") {
            icon = <AlertCircle size={16} className="text-red-400 shrink-0" />;
            borderClass = "border-red-500/20 bg-slate-900/90 text-white";
          } else if (t.type === "emit") {
            icon = <Radio size={16} className="text-purple-400 shrink-0" />;
            borderClass = "border-purple-500/30 bg-slate-900/95 text-white";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 transition-all ${borderClass}`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="font-medium leading-relaxed">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
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
