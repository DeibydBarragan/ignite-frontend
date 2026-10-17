"use client";

import { useState } from "react";
import type { DiscordUser } from "@/types/domain";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CoverImage } from "@/components/ui/cover-image";
import { LogOut, LogIn } from "lucide-react";

export interface UserBadgeProps {
  user: DiscordUser | null;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function UserBadge({ user, isLoggedIn, onLogin, onLogout }: UserBadgeProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!isLoggedIn || !user) {
    return (
      <button
        onClick={onLogin}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-md shadow-[#5865f2]/25 transition-all cursor-pointer"
      >
        <LogIn size={14} />
        <span>Conectar Discord</span>
      </button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="glass-panel flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-black/10 dark:border-white/10 select-none">
          <div className="relative">
            <CoverImage
              src={user.avatar}
              alt={user.username}
              className="w-7 h-7 rounded-full ring-1 ring-purple-500/40"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0d14]" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              @{user.username}
            </div>
          </div>
        </div>

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

      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
        maxWidth="sm"
        icon={<LogOut size={20} className="text-rose-500" />}
        title="Cerrar sesión"
        subtitle="¿Estás seguro de que deseas salir?"
        confirmText="Cerrar sesión"
        confirmVariant="danger"
        confirmIcon={<LogOut size={14} />}
      >
        <div className="space-y-3.5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
            <div className="relative shrink-0">
              <CoverImage
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full ring-2 ring-purple-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0d14]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                @{user.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tu biblioteca y favoritos seguirán guardados para cuando regreses.
              </p>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
