"use client";

import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserBadge } from "@/features/auth/components/user-badge";
import { Flame } from "lucide-react";

export function AppNav() {
  const { user, isLoggedIn, loginDiscord, logoutDiscord } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0b0d14]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
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
          <UserBadge
            user={user}
            isLoggedIn={isLoggedIn}
            onLogin={loginDiscord}
            onLogout={logoutDiscord}
          />
        </div>
      </div>
    </header>
  );
}
