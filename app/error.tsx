"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Global application boundary caught error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl text-center flex flex-col items-center gap-4 border border-rose-500/20 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <AlertTriangle size={32} />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Ha ocurrido un problema inesperado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error.message || "Error interno de la aplicación. Por favor, reintenta la operación."}
          </p>
        </div>
        {error.digest && (
          <code className="text-[10px] font-mono px-2 py-1 rounded bg-black/5 dark:bg-white/5 text-slate-500">
            Código: {error.digest}
          </code>
        )}
        <Button
          variant="solid"
          onClick={() => reset()}
          className="mt-2 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          <span>Reintentar</span>
        </Button>
      </div>
    </main>
  );
}
