"use client";

import type { Song } from "@/types/domain";
import type { SearchScope } from "@/types/music";
import { SongCard, SongCardSkeleton } from "../song-card";
import { Pagination } from "./pagination";
import { SONG_GRID } from "@/components/ui/grids";
import { Search, Star } from "lucide-react";

export interface SearchResultsSectionProps {
  query: string;
  scope: SearchScope;
  /** Cuántas son favoritas y cuántas solo de YouTube (para la línea de resumen). */
  favoritesCount: number;
  youtubeCount: number;
  /** Página actual de la lista combinada. */
  paginatedSongs: Song[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  /** YouTube todavía está respondiendo. */
  isSearching: boolean;
  onPageChange: (page: number) => void;
  onScopeChange: (scope: SearchScope) => void;
}

function summaryText(scope: SearchScope, favorites: number, youtube: number): string {
  if (scope === "favorites") return `${favorites} ${favorites === 1 ? "favorita" : "favoritas"}`;
  if (scope === "youtube") return `${youtube} de YouTube`;
  return `${favorites} ${favorites === 1 ? "favorita" : "favoritas"} · ${youtube} de YouTube`;
}

/**
 * Resultados de la búsqueda como tarjetas, en la misma rejilla que las favoritas.
 * Primero van las favoritas que coinciden; después, lo que viene de YouTube.
 * Cada tarjeta bloquea solo sus propios botones mientras actúa.
 */
export function SearchResultsSection({
  query,
  scope,
  favoritesCount,
  youtubeCount,
  paginatedSongs,
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  isSearching,
  onPageChange,
  onScopeChange,
}: SearchResultsSectionProps) {
  // Mientras YouTube responde se completan los huecos con tarjetas de carga.
  const skeletonCount = isSearching ? (paginatedSongs.length === 0 ? 12 : 6) : 0;
  const isEmpty = !isSearching && totalItems === 0;

  return (
    <div className="space-y-3" aria-busy={isSearching}>
      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <Search size={12} className="text-purple-400" />
        <span>
          Resultados para <span className="font-semibold text-slate-700 dark:text-slate-200">&ldquo;{query}&rdquo;</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>{isSearching && scope !== "favorites" ? "Buscando en YouTube…" : summaryText(scope, favoritesCount, youtubeCount)}</span>
      </div>

      {isEmpty ? (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <Star size={32} className="mx-auto text-amber-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {scope === "favorites"
              ? `Ninguna favorita coincide con “${query}”`
              : `Sin resultados para “${query}”`}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {scope === "favorites"
              ? "Prueba a buscar también en YouTube."
              : "Prueba con otro nombre, o pega un enlace de YouTube o Spotify."}
          </p>
          {scope === "favorites" && (
            <button
              type="button"
              onClick={() => onScopeChange("all")}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Buscar en todo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={SONG_GRID}>
            {paginatedSongs.map((song) => (
              <SongCard key={song.id || song.url} song={song} />
            ))}
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SongCardSkeleton key={`sk-${i}`} />
            ))}
          </div>

          {totalItems > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
