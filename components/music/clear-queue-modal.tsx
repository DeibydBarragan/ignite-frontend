"use client";

import { GlassModal } from "@/components/glass-modal";
import { Button } from "@heroui/react";
import { Trash2, AlertTriangle, ListMusic, Clock, Loader2 } from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function ClearQueueModal({
  isOpen,
  onClose,
  onConfirm,
  queueLength,
  totalDurationSeconds,
  isClearing = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  queueLength: number;
  totalDurationSeconds: number;
  isClearing?: boolean;
}) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Vaciar cola de reproducción"
      subtitle="¿Seguro que deseas eliminar todas las canciones en espera?"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isClearing}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            Conservar cola
          </Button>
          <Button
            size="sm"
            isDisabled={isClearing || queueLength === 0}
            onPress={onConfirm}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isClearing ? "Vaciando" : "Vaciar cola ahora"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Queue Info Preview Card */}
        <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <ListMusic size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {queueLength} {queueLength === 1 ? "canción en espera" : "canciones en espera"}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock size={12} className="text-purple-400" />
              <span>Duración total aproximada: ~{formatDuration(totalDurationSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta acción eliminará todas las pistas pendientes de la lista para todos los miembros conectados al canal de voz de Discord. El tema que está sonando actualmente continuará hasta terminar.
          </p>
        </div>
      </div>
    </GlassModal>
  );
}
