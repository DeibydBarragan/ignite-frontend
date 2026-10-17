"use client";

import type { Song } from "@/types/domain";
import { CoverImage } from "@/components/ui/cover-image";
import { Music2, ListPlus, Loader2, Play } from "lucide-react";

export interface SearchSuggestionsProps {
  searchResults: Song[];
  isSearching: boolean;
  onPick: (url: string, opts?: { next?: boolean; skip?: boolean }) => void;
}

export function SearchSuggestions({ searchResults, isSearching, onPick }: SearchSuggestionsProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-40 glass-dropdown bg-white/80 dark:bg-[#12151f]/85 backdrop-blur-xl p-2 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl space-y-1 overflow-hidden">
      {isSearching && searchResults.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin text-purple-400" />
          <span>Buscando videos en YouTube...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Music2 size={12} className="text-purple-400" />
              Videos de YouTube
            </span>
            {isSearching && <Loader2 size={11} className="animate-spin text-purple-400" />}
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
            {searchResults.map((video) => (
              <div
                key={video.id || video.url}
                className="group/item w-full p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-3 text-left"
              >
                {/* Thumbnail con badge de duración (clic para encolar) */}
                <div
                  title="Clic para añadir a la cola"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onPick(video.url);
                  }}
                  className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-black/20 cursor-pointer"
                >
                  <CoverImage
                    src={video.albumArt || video.coverUrl || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full"
                    imgClassName="group-hover/item:scale-105 transition-transform duration-200"
                  />
                  {video.formattedDuration && video.formattedDuration !== "00:00" && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 backdrop-blur-xs text-[9px] font-mono text-white rounded">
                      {video.formattedDuration}
                    </span>
                  )}
                </div>

                {/* Título exacto y canal / artista (clic para encolar) */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  title="Clic para añadir a la cola"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onPick(video.url);
                  }}
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover/item:text-purple-400 transition-colors">
                    {video.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <span>{video.artist}</span>
                    {video.isLive && (
                      <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                        EN VIVO
                      </span>
                    )}
                  </p>
                </div>

                {/* Botones de acción rápida: Siguiente y Play directo */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onPick(video.url, { next: true });
                    }}
                    title="Reproducir a continuación (salta la cola)"
                    className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <ListPlus size={12} />
                    <span className="hidden sm:inline">Sig</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onPick(video.url, { skip: true });
                    }}
                    title="Reproducir ahora mismo"
                    className="px-2.5 py-1 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Play size={11} className="fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
