"use client";

import { memo } from "react";
import type { SoundItem } from "@/types/domain";
import { formatRelativeTime } from "@/lib/formatters";
import { Volume2, Pencil, Trash2, Clock, Upload, Loader2 } from "lucide-react";

function formatPadTime(ts: number | null | undefined): string | null {
  return formatRelativeTime(ts ?? null);
}

export interface SoundPadProps {
  sound: SoundItem;
  isPlaying: boolean;
  isMine: boolean;
  showMineBadge: boolean;
  isAttachingAny: boolean;
  attachingSoundId: string | null;
  onPlay: () => void;
  onEdit: () => void;
  onAttach: () => void;
  onDelete: () => void;
}

export const SoundPad = memo(function SoundPad({
  sound,
  isPlaying,
  isMine,
  showMineBadge,
  isAttachingAny,
  attachingSoundId,
  onPlay,
  onEdit,
  onAttach,
  onDelete,
}: SoundPadProps) {
  const isPadBusy = isAttachingAny && attachingSoundId === sound.id;
  const isUploadingThis = attachingSoundId === sound.id;

  return (
    <button
      type="button"
      onClick={() => !isPadBusy && onPlay()}
      className={`group text-left relative glass-panel p-3.5 flex flex-col justify-between transition-all duration-150 ${
        isPadBusy ? "cursor-not-allowed opacity-80" : "cursor-pointer active:scale-95"
      } ${
        isPlaying
          ? "border-[#1db954] bg-[#1db954]/10 ring-1 ring-[#1db954]/50 shadow-sm"
          : "hover:border-purple-500/30 dark:hover:border-purple-500/30"
      }`}
    >
      <div className="flex items-start justify-between w-full mb-3">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 ${
            isPlaying
              ? "bg-[#1db954] text-black"
              : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10"
          }`}
        >
          {sound.emoji ? sound.emoji : <Volume2 size={20} className="text-purple-400" />}
        </div>

        {isPlaying ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1db954]" />
          </span>
        ) : sound.lastPlayedAt ? (
          <span
            className="text-[9px] font-sans text-slate-400 dark:text-slate-500 flex items-center gap-0.5 shrink-0 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md"
            title={`Último uso: ${formatPadTime(sound.lastPlayedAt)}`}
          >
            <Clock size={9} className="text-purple-400" />
            <span>{formatPadTime(sound.lastPlayedAt)}</span>
          </span>
        ) : null}
      </div>

      <div className="w-full min-w-0">
        <div
          className="font-medium text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5"
          title={`${sound.name}${sound.lastPlayedAt ? ` • Usado: ${formatPadTime(sound.lastPlayedAt)}` : ""}`}
        >
          <span className="truncate">{sound.name}</span>
          {isMine && showMineBadge && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              MÍO
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 tabular-nums font-mono">
          <span className="capitalize font-sans text-slate-500 dark:text-slate-400">
            {sound.category}
            {sound.hasFile && (
              <span className="ml-1 not-italic font-sans font-semibold text-[#1db954]" title="Tiene audio real: suena en Discord">
                · MP3
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              title="Editar nombre, emoji, categoría y ámbito"
              onClick={(ev) => {
                ev.stopPropagation();
                if (isPadBusy) return;
                onEdit();
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.stopPropagation();
                  if (isPadBusy) return;
                  onEdit();
                }
              }}
              className={`p-0.5 rounded transition-colors ${
                isPadBusy
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer text-slate-300 dark:text-slate-600 hover:text-purple-400"
              }`}
            >
              <Pencil size={11} />
            </span>
            <span
              role="button"
              tabIndex={0}
              title={
                isUploadingThis
                  ? "Subiendo audio"
                  : sound.hasFile
                  ? "Reemplazar audio MP3"
                  : "Subir audio MP3 para que suene en Discord"
              }
              onClick={(ev) => {
                ev.stopPropagation();
                if (isAttachingAny) return;
                onAttach();
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.stopPropagation();
                  if (isAttachingAny) return;
                  onAttach();
                }
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                isUploadingThis
                  ? "text-purple-400 cursor-not-allowed"
                  : sound.hasFile
                  ? "text-[#1db954] hover:text-[#1ed760]"
                  : "text-slate-300 dark:text-slate-600 hover:text-purple-400"
              }`}
            >
              {isUploadingThis ? (
                <Loader2 size={11} className="animate-spin text-purple-400" />
              ) : (
                <Upload size={11} />
              )}
            </span>
            <span
              role="button"
              tabIndex={0}
              title="Eliminar sonido"
              onClick={(ev) => {
                ev.stopPropagation();
                if (isPadBusy) return;
                onDelete();
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.stopPropagation();
                  if (isPadBusy) return;
                  onDelete();
                }
              }}
              className={`p-0.5 rounded transition-colors ${
                isPadBusy
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer text-slate-300 dark:text-slate-600 hover:text-rose-500"
              }`}
            >
              <Trash2 size={11} />
            </span>
          </span>
        </div>
      </div>
    </button>
  );
});
