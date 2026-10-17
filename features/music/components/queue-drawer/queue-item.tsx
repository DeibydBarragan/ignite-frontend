"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Song } from "@/types/domain";
import { formatDuration } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { User, Star, ChevronUp, ChevronDown, GripVertical, Play, X, Loader2 } from "lucide-react";

export interface SortableQueueItemProps {
  id: string;
  song: Song;
  index: number;
  isLast: boolean;
  disabled: boolean;
  removing: boolean;
  onMove: (from: number, to: number) => void;
  onJump: (index: number) => void;
  onRemove: (songId: string) => void;
  isFav: boolean;
  onToggleFavorite: (song: Song) => void;
}

export const SortableQueueItem = memo(function SortableQueueItem({
  id,
  song,
  index,
  isLast,
  disabled,
  removing,
  onMove,
  onJump,
  onRemove,
  isFav,
  onToggleFavorite,
}: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const isItemBusy = disabled || removing;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 p-2 rounded-xl transition-colors border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] ${
        isDragging
          ? "opacity-40 border-purple-500/40 bg-purple-500/5 shadow-lg z-10"
          : "hover:bg-black/5 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          {...attributes}
          {...listeners}
          title="Arrastra para reordenar"
          className={`p-1 -ml-1 rounded shrink-0 ${
            isItemBusy
              ? "opacity-30 cursor-not-allowed touch-auto"
              : "cursor-grab active:cursor-grabbing touch-none text-slate-300 dark:text-slate-600 hover:text-purple-400"
          }`}
        >
          <GripVertical size={14} />
        </span>
        <span className="text-xs font-mono text-slate-400 w-5 text-center">
          #{index + 1}
        </span>
        <CoverImage
          src={song.albumArt}
          alt={song.title}
          className="w-9 h-9 rounded-lg"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {song.title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            <span className="truncate">{song.artist}</span>
            {song.requestedBy?.username && (
              <>
                <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                <span
                  className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium shrink-0"
                  title={`Añadido por ${song.requestedBy.username}`}
                >
                  {song.requestedBy.avatar ? (
                    <CoverImage
                      src={song.requestedBy.avatar}
                      alt={song.requestedBy.username}
                      className="w-3 h-3 rounded-full inline-block shrink-0"
                    />
                  ) : (
                    <User size={10} className="inline-block shrink-0" />
                  )}
                  <span className="truncate max-w-[90px]">{song.requestedBy.username}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] font-mono text-slate-400 mr-1">
          {formatDuration(song.duration)}
        </span>
        <button
          type="button"
          onClick={() => onToggleFavorite(song)}
          disabled={isItemBusy}
          title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`p-1 rounded-lg transition-colors ${
            isItemBusy
              ? "opacity-30 cursor-not-allowed"
              : isFav
              ? "text-amber-400 hover:bg-amber-400/10 cursor-pointer"
              : "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 cursor-pointer"
          }`}
        >
          <Star size={13} className={isFav ? "fill-amber-400" : ""} />
        </button>
        <button
          onClick={() => onMove(index, index - 1)}
          disabled={isItemBusy || index === 0}
          title="Subir en la cola"
          className={`p-1 rounded-lg transition-colors ${
            isItemBusy || index === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 cursor-pointer"
          }`}
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={() => onMove(index, index + 1)}
          disabled={isItemBusy || isLast}
          title="Bajar en la cola"
          className={`p-1 rounded-lg transition-colors ${
            isItemBusy || isLast
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 cursor-pointer"
          }`}
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={() => onJump(index)}
          disabled={isItemBusy}
          title="Saltar a este tema ahora"
          className={`p-1 rounded-lg transition-colors ${
            isItemBusy
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 cursor-pointer"
          }`}
        >
          <Play size={13} />
        </button>
        <button
          onClick={() => onRemove(song.id)}
          disabled={isItemBusy}
          title="Eliminar de la cola"
          className={`p-1 rounded-lg transition-colors ${
            isItemBusy
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 cursor-pointer"
          }`}
        >
          {removing ? (
            <Loader2 size={13} className="animate-spin text-rose-400" />
          ) : (
            <X size={13} />
          )}
        </button>
      </div>
    </div>
  );
});
