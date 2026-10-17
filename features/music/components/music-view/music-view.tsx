"use client";

import { useState, useMemo, useRef } from "react";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useFavorites } from "@/context/favorites-context";
import { useQueueActions } from "@/hooks/use-queue-actions";
import { useUrlImport } from "@/hooks/use-url-import";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useLiveSearch } from "@/hooks/use-live-search";
import { useRecommendations } from "@/features/music/hooks/use-recommendations";
import { detectPlatform } from "@/lib/formatters";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useToast } from "@/components/ui/toast";
import { MusicSearchBar } from "./music-search-bar";
import { MusicCatalogTabs } from "./music-catalog-tabs";
import { RadioHeader, TopSongsHeader } from "./recommendations-header";
import { MusicResultsSection } from "./music-results-section";
import type { MusicSubTab, TopSubTab } from "@/types/music";

function detectInputPlatform(text: string): "spotify" | "youtube" | null {
  const found = detectPlatform(text);
  if (found) return found;
  const t = text.trim().toLowerCase();
  if (t.startsWith("http://") || t.startsWith("https://")) return "spotify";
  return null;
}

export function MusicView() {
  const { selectedGuildId } = useAuth();
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const { favorites, isLoadingFavorites, playFavorites } = useFavorites();
  const { playSong, addToQueue } = useQueueActions();
  const importUrlSong = useUrlImport();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useLocalStorage<MusicSubTab>(
    STORAGE_KEYS.musicSubtab,
    "radio",
    z.enum(["radio", "favorites", "top", "playlists"])
  );
  const [topSubTab, setTopSubTab] = useLocalStorage<TopSubTab>(
    STORAGE_KEYS.musicTopSubtab,
    "week",
    z.enum(["week", "month", "all"])
  );

  const [searchInput, setSearchInput] = useState("");

  const radioSongKey = activeTab === "radio" ? currentSong?.id : undefined;
  const { recSongs, basedOnSong, isLoadingRecs, refresh: refreshRecs } = useRecommendations({
    activeTab,
    topSubTab,
    selectedGuildId,
    radioSongKey,
  });

  const isImporting = isPlayerBusy && (pendingAction === "queue" || pendingAction === "playNext");
  const detectedPlatform = useMemo(() => detectInputPlatform(searchInput.trim()), [searchInput]);
  const isUrl = detectedPlatform !== null;

  const { searchResults, setSearchResults, isSearching, showSuggestions, setShowSuggestions } =
    useLiveSearch(searchInput, isUrl);

  const playAllRecs = async () => {
    if (isPlayerBusy || recSongs.length === 0) return;
    const [first, ...rest] = recSongs;
    await playSong(first);
    for (const song of rest) {
      await addToQueue(song);
    }
  };

  const currentList = activeTab === "favorites" ? favorites : recSongs;

  const displayedSongs = useMemo(() => {
    if (isUrl) return currentList;
    const query = searchInput.toLowerCase().trim();
    if (!query) return currentList;
    return currentList.filter((song) => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.source.toLowerCase().includes(query)
      );
    });
  }, [currentList, searchInput, isUrl]);

  // ══════════ PAGINACIÓN TRADICIONAL ══════════
  const ITEMS_PER_PAGE = 12;
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  const pageResetKey = `${activeTab}|${topSubTab}|${searchInput}`;
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const currentPage = pageState.key === pageResetKey ? pageState.page : 1;
  const setCurrentPage = (page: number) => setPageState({ key: pageResetKey, page });

  const totalPages = Math.max(1, Math.ceil(displayedSongs.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSongs = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return displayedSongs.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedSongs, safeCurrentPage]);

  const goToPage = (page: number) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submitQuery = async (rawQuery: string, opts?: { next?: boolean; skip?: boolean }) => {
    if (isPlayerBusy) return;
    const query = rawQuery.trim();
    if (!query) return;

    setShowSuggestions(false);
    setSearchResults([]);

    try {
      const res = await importUrlSong(query, { next: opts?.next, skip: opts?.skip });
      if (res.success) {
        toast(res.message, "success");
        setSearchInput("");
      } else {
        toast(res.message, "error");
      }
    } catch {
      toast("Ocurrió un error al procesar la canción.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* ══════════ COMANDO: BÚSQUEDA Y DETECCIÓN DE ENLACES ══════════ */}
      <div className="space-y-2.5">
        <MusicSearchBar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          isUrl={isUrl}
          detectedPlatform={detectedPlatform}
          isImporting={isImporting}
          isPlayerBusy={isPlayerBusy}
          pendingAction={pendingAction}
          searchResults={searchResults}
          isSearching={isSearching}
          showSuggestions={showSuggestions}
          onShowSuggestionsChange={setShowSuggestions}
          onSubmit={submitQuery}
        />

        {/* ══════════ TABS DE NAVEGACIÓN DEL CATÁLOGO ══════════ */}
        <MusicCatalogTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          favoritesCount={favorites.length}
          radioSongsCount={activeTab === "radio" ? recSongs.length : 0}
          topSongsCount={activeTab === "top" ? recSongs.length : 0}
          hasActiveRadio={currentSong !== null}
          isPlayerBusy={isPlayerBusy}
          onPlayFavorites={playFavorites}
          scrollRef={catalogScrollRef}
        />
      </div>

      {/* ══════════ CABECERA: RADIO EN VIVO ══════════ */}
      {activeTab === "radio" && (
        <RadioHeader
          basedOnSong={basedOnSong}
          isLoadingRadio={isLoadingRecs}
          radioSongsCount={recSongs.length}
          isPlayerBusy={isPlayerBusy}
          onRefresh={refreshRecs}
          onPlayAll={playAllRecs}
        />
      )}

      {/* ══════════ CABECERA: TOP CANCIONES ══════════ */}
      {activeTab === "top" && (
        <TopSongsHeader
          topSubTab={topSubTab}
          onTopSubTabChange={setTopSubTab}
          isLoadingTop={isLoadingRecs}
          topSongsCount={recSongs.length}
          isPlayerBusy={isPlayerBusy}
          onRefresh={refreshRecs}
          onPlayAll={playAllRecs}
        />
      )}

      {/* ══════════ LISTA DE CANCIONES / PLAYLISTS / ESTADOS ══════════ */}
      <MusicResultsSection
        activeTab={activeTab}
        topSubTab={topSubTab}
        favoritesCount={favorites.length}
        isLoadingFavorites={isLoadingFavorites}
        isLoadingRecs={isLoadingRecs}
        songsCount={recSongs.length}
        displayedSongs={displayedSongs}
        paginatedSongs={paginatedSongs}
        searchInput={searchInput}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={goToPage}
        onExploreSuggestions={() => setActiveTab("radio")}
      />
    </div>
  );
}
