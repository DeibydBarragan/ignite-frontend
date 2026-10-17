"use client";

import type { Song } from "@/types/domain";
import type { MusicSubTab, TopSubTab } from "@/types/music";
import { SongCard } from "../song-card";
import { PlaylistsView } from "../playlists/playlists-view";
import { Pagination } from "./pagination";
import { Loader2, Star, Sparkles, Radio, Trophy, Music2 } from "lucide-react";

export interface MusicResultsSectionProps {
  activeTab: MusicSubTab;
  topSubTab: TopSubTab;
  favoritesCount: number;
  isLoadingFavorites: boolean;
  isLoadingRecs: boolean;
  songsCount: number;
  displayedSongs: Song[];
  paginatedSongs: Song[];
  searchInput: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onExploreSuggestions: () => void;
}

export function MusicResultsSection({
  activeTab,
  topSubTab,
  favoritesCount,
  isLoadingFavorites,
  isLoadingRecs,
  songsCount,
  displayedSongs,
  paginatedSongs,
  searchInput,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onExploreSuggestions,
}: MusicResultsSectionProps) {
  if (activeTab === "playlists") {
    return <PlaylistsView />;
  }

  if (activeTab === "favorites") {
    if (isLoadingFavorites) {
      return (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-amber-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Cargando tus favoritos desde Supabase...</p>
        </div>
      );
    }

    if (favoritesCount === 0) {
      return (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <Star size={36} className="mx-auto text-amber-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Aún no tienes canciones favoritas
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Presiona el botón <span className="font-semibold text-amber-400">⭐ Favorito</span> en Discord mientras escuchas música, o guarda canciones desde la radio o el top.
          </p>
          <button
            type="button"
            onClick={onExploreSuggestions}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Sintonizar Radio en vivo</span>
          </button>
        </div>
      );
    }
  }

  if (activeTab === "radio") {
    if (isLoadingRecs) {
      return (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-purple-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Sintonizando radio en vivo...</p>
        </div>
      );
    }

    if (songsCount === 0) {
      return (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <Radio size={36} className="mx-auto text-purple-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            La Radio en vivo se activa con la música
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            No hay ninguna canción sonando ahora mismo en el bot. Pon una canción en Discord o desde el buscador para generar una radio con temas afines.
          </p>
        </div>
      );
    }
  }

  if (activeTab === "top") {
    if (isLoadingRecs) {
      return (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-amber-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Cargando el ranking del servidor...</p>
        </div>
      );
    }

    if (songsCount === 0) {
      return (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <Trophy size={36} className="mx-auto text-amber-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Aún no hay reproducciones en el {topSubTab === "week" ? "Top Semanal" : topSubTab === "month" ? "Top Mensual" : "Top Histórico"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Cada canción que tú o tus amigos escuchen en Discord sumará reproducciones y aparecerá aquí automáticamente.
          </p>
        </div>
      );
    }
  }

  if (displayedSongs.length === 0) {
    return (
      <div className="p-12 text-center glass-panel">
        <Music2 size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Sin resultados para &ldquo;{searchInput}&rdquo;
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Puedes pegar un enlace directo de Spotify o YouTube para reproducirlo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {paginatedSongs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {displayedSongs.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayedSongs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
