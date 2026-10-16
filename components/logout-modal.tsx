"use client";

import { useState } from "react";
import { GlassModal } from "@/components/glass-modal";
import { Button } from "@heroui/react";
import { LogOut, Loader2 } from "lucide-react";
import { DiscordUser } from "@/lib/mock-data";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  user: DiscordUser | null;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      icon={<LogOut size={20} className="text-rose-500" />}
      title="Cerrar sesión"
      subtitle="¿Estás seguro de que deseas salir?"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isLoggingOut}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            isDisabled={isLoggingOut}
            onPress={handleLogout}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>{isLoggingOut ? "Cerrando sesión" : "Cerrar sesión"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0d14]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                @{user.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Cuenta de Discord conectada
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Al cerrar sesión, saldrás de tu cuenta en este dispositivo. Tus listas de favoritos y configuraciones seguirán guardadas de forma segura en tu cuenta de Discord.
        </p>
      </div>
    </GlassModal>
  );
}
