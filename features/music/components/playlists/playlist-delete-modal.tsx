"use client";

import type { UserPlaylist } from "@/types/domain";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CoverImage } from "@/components/ui/cover-image";
import { Trash2, AlertTriangle, Music2 } from "lucide-react";

export interface PlaylistDeleteModalProps {
  playlist: UserPlaylist | null;
  onClose: () => void;
  onConfirm: (id: string, name: string) => Promise<void>;
}

export function PlaylistDeleteModal({
  playlist,
  onClose,
  onConfirm,
}: PlaylistDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={!!playlist}
      onClose={onClose}
      onConfirm={async () => {
        if (!playlist) return;
        const target = playlist;
        onClose();
        await onConfirm(target.id, target.name);
      }}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Eliminar playlist"
      subtitle={playlist ? `¿Seguro que deseas eliminar «${playlist.name}»?` : undefined}
      confirmText="Eliminar definitivamente"
      confirmVariant="danger"
      confirmIcon={<Trash2 size={14} />}
    >
      {playlist && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-black/10 dark:bg-white/5 shrink-0">
              <CoverImage src={playlist.cover} alt={playlist.name} sizes="56px" className="w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {playlist.name}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    playlist.source === "spotify"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {playlist.source === "spotify" ? "Spotify" : "YouTube"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <Music2 size={11} className="text-purple-400" />
                  {playlist.tracks?.length ?? 0} temas
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Esta playlist se eliminará de tu biblioteca de Ignite. Las canciones seguirán existiendo en tu cuenta de origen.
            </p>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
