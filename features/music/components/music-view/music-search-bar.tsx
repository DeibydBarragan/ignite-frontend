"use client";

import type { Song } from "@/types/domain";
import type { MusicPlatform } from "@/types/music";
import type { PendingAction } from "@/types/player";
import { SearchSuggestions } from "./search-suggestions";
import { Search, Link2, Plus, ListPlus, Loader2 } from "lucide-react";

export interface MusicSearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  isUrl: boolean;
  detectedPlatform: MusicPlatform | null;
  isImporting: boolean;
  isPlayerBusy: boolean;
  pendingAction: PendingAction;
  searchResults: Song[];
  isSearching: boolean;
  showSuggestions: boolean;
  onShowSuggestionsChange: (value: boolean) => void;
  onSubmit: (rawQuery: string, opts?: { next?: boolean; skip?: boolean }) => void;
}

export function MusicSearchBar({
  searchInput,
  onSearchInputChange,
  isUrl,
  detectedPlatform,
  isImporting,
  isPlayerBusy,
  pendingAction,
  searchResults,
  isSearching,
  showSuggestions,
  onShowSuggestionsChange,
  onSubmit,
}: MusicSearchBarProps) {
  const handleImport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(searchInput);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Search size={13} className="text-purple-400" />
          <span className="font-semibold">Reproducir o buscar canción</span>
        </div>
        {isSearching && (
          <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
            <Loader2 size={12} className="animate-spin" />
            <span className="hidden sm:inline">Buscando videos...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleImport} className="relative w-full">
        <div className="relative w-full flex items-center">
          {isUrl ? (
            <Link2 size={16} className="absolute left-3.5 text-[#1ed760] transition-colors" />
          ) : (
            <Search size={16} className="absolute left-3.5 text-slate-400" />
          )}

          <input
            type="text"
            placeholder="Buscar canción, artista o pegar enlace de YouTube / Spotify..."
            value={searchInput}
            disabled={isImporting}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) onShowSuggestionsChange(true);
            }}
            onBlur={() => {
              setTimeout(() => onShowSuggestionsChange(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onShowSuggestionsChange(false);
            }}
            className={`glass-input w-full pl-10 pr-52 sm:pr-60 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 ${
              isImporting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />

          {/* Platform badge & Direct action buttons */}
          {searchInput.trim().length > 0 && (
            <div className="absolute right-2 flex items-center gap-1.5">
              {isUrl && (
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  {detectedPlatform}
                </span>
              )}
              <button
                type="button"
                onClick={() => onSubmit(searchInput, { next: true })}
                disabled={isPlayerBusy}
                title="Reproducir a continuación (saltarse la cola)"
                className={`px-2.5 py-1 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all ${
                  isPlayerBusy
                    ? "opacity-60 cursor-not-allowed"
                    : "active:scale-95 cursor-pointer"
                }`}
              >
                {isImporting && pendingAction === "playNext" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Sig</span>
                  </>
                ) : (
                  <>
                    <ListPlus size={13} />
                    <span>Siguiente</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={isPlayerBusy}
                title="Añadir al final de la cola"
                className={`px-3 py-1 rounded-lg bg-[#1db954] text-black text-xs font-semibold shadow-xs flex items-center gap-1 transition-all ${
                  isPlayerBusy
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-[#1ed760] active:scale-95 cursor-pointer"
                }`}
              >
                {isImporting && pendingAction === "queue" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Encolando</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Encolar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Dropdown: Videos exactos de YouTube */}
        {showSuggestions && (searchResults.length > 0 || isSearching) && (
          <SearchSuggestions
            searchResults={searchResults}
            isSearching={isSearching}
            onPick={(url, opts) => {
              onShowSuggestionsChange(false);
              onSubmit(url, opts);
            }}
          />
        )}
      </form>
    </div>
  );
}
