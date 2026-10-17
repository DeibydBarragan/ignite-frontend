"use client";

import type { UserPlaylist } from "@/types/domain";
import { GlassModal } from "@/components/ui/glass-modal";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Star, Loader2 } from "lucide-react";

export interface PlaylistFavModalProps {
  playlist: UserPlaylist | null;
  isFav: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PlaylistFavModal({
  playlist,
  isFav,
  isProcessing,
  onClose,
  onConfirm,
}: PlaylistFavModalProps) {
  return (
    <GlassModal
      isOpen={!!playlist}
      onClose={() => !isProcessing && onClose()}
      maxWidth="md"
      icon={
        playlist && isFav ? (
          <Star size={20} className="text-rose-500 fill-rose-500" />
        ) : (
          <Star size={20} className="text-amber-400 fill-amber-400" />
        )
      }
      title={playlist && isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      subtitle={
        playlist
          ? isFav
            ? `¿Deseas quitar «${playlist.name}» de tus favoritos?`
            : `¿Deseas guardar los temas de «${playlist.name}»?`
          : undefined
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isProcessing}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            isDisabled={isProcessing}
            onPress={onConfirm}
            className={
              playlist && isFav
                ? "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                : "bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            }
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Star
                size={14}
                className={
                  playlist && isFav
                    ? "fill-white text-white"
                    : "fill-black text-black"
                }
              />
            )}
            <span>
              {isProcessing
                ? "Procesando"
                : playlist && isFav
                ? "Quitar de favoritos"
                : "Confirmar y guardar"}
            </span>
          </Button>
        </div>
      }
    >
      {playlist && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0">
              <CoverImage
                src={playlist.cover}
                alt={playlist.name}
                sizes="56px"
                className="w-full h-full"
                iconSize={24}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {playlist.name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="capitalize">{playlist.source}</span>
                <span>•</span>
                <span>
                  {playlist.tracks.length > 0
                    ? `${playlist.tracks.length} temas`
                    : "Todos los temas de la playlist"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isFav
              ? "Se eliminarán las canciones de esta playlist de tu lista personal de favoritos de Discord."
              : "Esta acción añadirá las canciones de esta playlist a tu lista de favoritos de Discord para que puedas escucharlas en cualquier momento sin tener que buscar la playlist completa."}
          </p>
        </div>
      )}
    </GlassModal>
  );
}
