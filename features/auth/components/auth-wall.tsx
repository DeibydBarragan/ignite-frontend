"use client";

import { Flame, Loader2, Lock, LogIn, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export interface AuthWallProps {
  isLoading: boolean;
  onLogin: () => void;
}

export function AuthWall({ isLoading, onLogin }: AuthWallProps) {
  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Flame size={32} className="text-purple-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Loader2 size={14} className="animate-spin text-purple-500" />
            <span>Verificando sesión con Discord...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 max-w-lg mx-auto w-full relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
      </div>
      <div className="glass-panel p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl text-center flex flex-col items-center relative overflow-hidden w-full">
        {/* Background ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Badge */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-600/30">
            <Flame size={38} className="text-white fill-white/20" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#5865f2] text-white shadow-md">
            <ShieldAlert size={14} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
          <Lock size={12} />
          <span>Acceso Restringido</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ignite
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
          Inicia sesión con tu cuenta de Discord para acceder al reproductor, controlar la música y ver tu biblioteca personal de favoritos.
        </p>

        {/* Discord Login Button */}
        <button
          onClick={onLogin}
          className="w-full mt-6 py-3.5 px-6 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-[#5865f2]/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
        >
          <LogIn size={18} className="transition-transform group-hover:translate-x-0.5" />
          <span>Conectar con Discord</span>
        </button>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          Solo verificamos tu usuario de Discord para sincronizar tus favoritos.
        </p>
      </div>
    </main>
  );
}
