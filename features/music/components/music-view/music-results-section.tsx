"use client";

import type { Song } from "@/types/domain";
import type { MusicSubTab, RecommendationsSubTab } from "@/types/music";
import { SongCard } from "../song-card";
import { PlaylistsView } from "../playlists/playlists-view";
import { Pagination } from "./pagination";
import { Loader2, Star, Sparkles, Radio, Trophy, Music2 } from "lucide-react";

export interface MusicResultsSectionProps {
  activeTab: MusicSubTab;
  favoritesCount: number;
  isLoadingFavorites: boolean;
  isLoadingRecs: boolean;
  recSubTab: RecommendationsSubTab;
  recSongsCount: number;
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
  favoritesCount,
  isLoadingFavorites,
  isLoadingRecs,
  recSubTab,
  recSongsCount,
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

  if (isLoadingFavorites && activeTab === "favorites") {
    return (
      <div className="p-12 text-center glass-panel">
        <Loader2 size={28} className="mx-auto text-amber-400 animate-spin mb-2" />
        <p className="text-xs text-slate-400">Cargando tus favoritos desde Supabase...</p>
      </div>
    );
  }

  if (activeTab === "favorites" && favoritesCount === 0) {
    return (
      <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
        <Star size={36} className="mx-auto text-amber-400/40 mb-3" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Aún no tienes canciones favoritas
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Presiona el botón <span className="font-semibold text-amber-400">⭐ Favorito</span> en Discord mientras escuchas música, o guarda canciones desde las recomendaciones.
        </p>
        <button
          onClick={onExploreSuggestions}
          className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Explorar sugerencias</span>
        </button>
      </div>
    );
  }

  if (activeTab === "catalog" && isLoadingRecs) {
    return (
      <div className="p-12 text-center glass-panel">
        <Loader2 size={28} className="mx-auto text-purple-400 animate-spin mb-2" />
        <p className="text-xs text-slate-400">
          {recSubTab === "radio" ? "Sintonizando radio contextual..." : "Cargando el ranking del servidor..."}
        </p>
      </div>
    );
  }

  if (activeTab === "catalog" && recSongsCount === 0) {
    return (
      <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
        {recSubTab === "radio" ? (
          <>
            <Radio size={36} className="mx-auto text-purple-400/40 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              La Radio en vivo se activa con la música
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No hay ninguna canción sonando ahora mismo en el bot. Pon una canción en Discord o desde el buscador para generar una radio con temas afines.
            </p>
          </>
        ) : (
          <>
            <Trophy size={36} className="mx-auto text-amber-400/40 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Aún no hay reproducciones en el {recSubTab === "week" ? "Top Semanal" : recSubTab === "month" ? "Top Mensual" : "Top Histórico"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Cada canción que tú o tus amigos escuchen en Discord sumará reproducciones y aparecerá aquí automáticamente.
            </p>
          </>
        )}
      </div>
    );
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
