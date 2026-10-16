"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutModal } from "@/components/logout-modal";
import {
  Flame,
  LogOut,
  LogIn,
} from "lucide-react";

export function AppNav() {
  const {
    user,
    isLoggedIn,
    loginDiscord,
    logoutDiscord,
  } = useBot();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0b0d14]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 dark:bg-purple-600 text-white shadow-md shadow-purple-600/20">
            <Flame size={18} className="fill-white/20" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tracking-tight text-base text-slate-900 dark:text-white">
              ignite
            </span>
          </div>
        </div>

        {/* Right side: Discord User Login & Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {/* User profile / Login */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              {/* User badge (avatar + username, sin dropdown) */}
              <div className="glass-panel flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-black/10 dark:border-white/10 select-none">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/40"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0d14]" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    @{user.username}
                  </div>
                </div>
              </div>

              {/* Botón de cerrar sesión ubicado afuera */}
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="h-9 px-2.5 sm:px-3 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shrink-0"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={loginDiscord}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-md shadow-[#5865f2]/25 transition-all cursor-pointer"
            >
              <LogIn size={14} />
              <span>Conectar Discord</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmación para cerrar sesión */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logoutDiscord}
        user={user}
      />
    </header>
  );
}
