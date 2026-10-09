"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Flame,
  ChevronDown,
  Radio,
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

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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
            <span className="h-1.5 w-1.5 rounded-full bg-[#1db954]" title="Bot activo" />
          </div>
        </div>

        {/* Right side: Bot status & Discord User Login */}
        <div className="flex items-center gap-2.5">
          {/* Bot Online status pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
            <Radio size={12} className="animate-pulse" />
            <span>Bot Online</span>
          </div>

          <ThemeToggle />

          {/* User profile / Login */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="glass-btn flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-black/10 dark:border-white/10"
              >
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    #{user.discriminator}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="glass-dropdown absolute right-0 mt-2 w-56 p-2 z-40 border border-black/10 dark:border-white/10 glass-modal-enter shadow-2xl">
                    <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        @{user.username}#{user.discriminator}
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          logoutDiscord();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
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
    </header>
  );
}
