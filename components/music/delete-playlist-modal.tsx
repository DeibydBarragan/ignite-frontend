"use client";

import { useState } from "react";
import { GlassModal } from "@/components/glass-modal";
import { UserPlaylist, deleteUserPlaylist, FALLBACK_COVER } from "@/lib/playlists-service";
import { Button } from "@heroui/react";
import { Trash2, AlertTriangle, Music2, Loader2 } from "lucide-react";

export function DeletePlaylistModal({
  playlist,
  onClose,
  onDeleted,
}: {
  playlist: UserPlaylist | null;
  onClose: () => void;
  onDeleted: (id: string, name?: string) => Promise<void> | void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!playlist) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteUserPlaylist(playlist.id);
      setIsDeleting(false);
      await onDeleted(playlist.id, playlist.name);
      onClose();
    } catch {
      setError("No se pudo eliminar la playlist. Inténtalo de nuevo.");
      setIsDeleting(false);
    }
  };

  const isSpotify = playlist.source === "spotify";
  const trackCount = playlist.tracks ? playlist.tracks.length : 0;

  return (
    <GlassModal
      isOpen={!!playlist}
      onClose={onClose}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Eliminar playlist"
      subtitle={`¿Seguro que deseas eliminar «${playlist.name}»?`}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isDeleting}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            isDisabled={isDeleting}
            onPress={handleDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isDeleting ? "Eliminando" : "Eliminar definitivamente"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Playlist Info Preview Card */}
        <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl overflow-hidden bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playlist.cover || FALLBACK_COVER}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {playlist.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  isSpotify
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                {isSpotify ? "Spotify" : "YouTube"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Music2 size={11} className="text-purple-400" />
                {trackCount} {trackCount === 1 ? "tema" : "temas"}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta playlist se eliminará de tu biblioteca de Ignite. Las canciones seguirán existiendo en {isSpotify ? "Spotify" : "YouTube"}, pero se borrarán de tu lista de acceso rápido y sus pistas sincronizadas.
          </p>
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </GlassModal>
  );
}
