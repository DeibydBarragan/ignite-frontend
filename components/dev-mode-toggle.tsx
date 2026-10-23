"use client";

import { useDevMode } from "@/features/auth/hooks/use-dev-mode";
import { useToast } from "@/components/ui/toast";
import { Terminal, ShieldAlert } from "lucide-react";

export function DevModeToggle() {
  const { isDevUser, isDevMode, toggleDevMode } = useDevMode();
  const { toast } = useToast();

  if (!isDevUser) return null;

  const handleClick = async () => {
    const nextState = await toggleDevMode();
    if (nextState) {
      toast(
        "⚡ Modo Dev ACTIVADO: Tus reproducciones no se registrarán en la base de datos.",
        "info"
      );
    } else {
      toast(
        "Modo Dev DESACTIVADO: Tus reproducciones se registrarán normalmente en la base de datos.",
        "success"
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        isDevMode
          ? "Modo Desarrollador Activo: Las canciones que reproduzcas NO se guardarán en Supabase (song_plays)."
          : "Modo Desarrollador Inactivo: Haz clic para evitar registrar tus reproducciones en la base de datos."
      }
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none ${
        isDevMode
          ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10"
          : "bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isDevMode ? (
          <Terminal size={14} className="text-amber-500 dark:text-amber-400 animate-pulse" />
        ) : (
          <Terminal size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        )}
        <span className="hidden sm:inline">Modo Dev</span>
      </div>

      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
          isDevMode
            ? "bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30"
            : "bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400"
        }`}
      >
        {isDevMode ? "SIN BD" : "OFF"}
      </span>
    </button>
  );
}
