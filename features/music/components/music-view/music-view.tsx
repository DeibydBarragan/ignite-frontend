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
import { usePlaylists } from "@/hooks/use-playlists";
import { usePlaylistSearch } from "@/features/music/hooks/use-playlist-search";
import { useRecommendations } from "@/features/music/hooks/use-recommendations";
import { detectPlatform } from "@/lib/formatters";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useToast } from "@/components/ui/toast";
import { MusicSearchBar } from "./music-search-bar";
import { MusicCatalogTabs } from "./music-catalog-tabs";
import { RadioHeader, TopSongsHeader } from "./recommendations-header";
import { MusicResultsSection } from "./music-results-section";
import { SearchResultsSection } from "./search-results-section";
import { buildSearchResults } from "../../lib/build-search-results";
import { buildPlaylistSearchResults } from "../../lib/build-playlist-search-results";
import type { Song, UserPlaylist } from "@/types/domain";
import type { MusicSubTab, SearchScope, TopSubTab } from "@/types/music";

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
  const [searchScope, setSearchScope] = useLocalStorage<SearchScope>(
    STORAGE_KEYS.musicSearchScope,
    "all",
    z.enum(["all", "favorites", "youtube", "playlists"])
  );

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

  const playlistsState = usePlaylists();
  const { playlists: userPlaylists } = playlistsState;

  const { searchResults, isSearching } = useLiveSearch(searchInput, isUrl, searchScope);
  const { playlistResults, isSearchingPlaylists } = usePlaylistSearch(searchInput, isUrl, searchScope);

  // Con texto (2+ letras, no un enlace) la zona de tarjetas muestra los resultados de búsqueda.
  const isSearchActive = !isUrl && searchInput.trim().length >= 2;
  const isPlaylistSearch = isSearchActive && searchScope === "playlists";

  const searchGroups = useMemo(
    () =>
      buildSearchResults({
        query: searchInput,
        scope: searchScope,
        favorites,
        youtube: searchResults,
      }),
    [searchInput, searchScope, favorites, searchResults]
  );

  const playlistSearchGroups = useMemo(
    () =>
      buildPlaylistSearchResults({
        query: searchInput,
        userPlaylists,
        youtubePlaylists: playlistResults,
      }),
    [searchInput, userPlaylists, playlistResults]
  );

  const playAllRecs = async () => {
    if (isPlayerBusy || recSongs.length === 0) return;
    const [first, ...rest] = recSongs;
    await playSong(first);
    for (const song of rest) {
      await addToQueue(song);
    }
  };

  const displayedSongs = activeTab === "favorites" ? favorites : recSongs;
  const pagedSource = isSearchActive
    ? isPlaylistSearch
      ? playlistSearchGroups.combined
      : searchGroups.combined
    : displayedSongs;

  // ══════════ PAGINACIÓN TRADICIONAL ══════════
  const ITEMS_PER_PAGE = 12;
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  const pageResetKey = `${activeTab}|${topSubTab}|${isSearchActive ? `${searchScope}|${searchInput}` : ""}`;
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const currentPage = pageState.key === pageResetKey ? pageState.page : 1;
  const setCurrentPage = (page: number) => setPageState({ key: pageResetKey, page });

  const totalPages = Math.max(1, Math.ceil(pagedSource.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return pagedSource.slice(start, start + ITEMS_PER_PAGE);
  }, [pagedSource, safeCurrentPage]);

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

  const handleTabChange = (tab: MusicSubTab) => {
    // Elegir una pestaña sale de la búsqueda y sincroniza el ámbito
    setSearchInput("");
    setActiveTab(tab);
    if (tab === "playlists") {
      setSearchScope("playlists");
    } else if (searchScope === "playlists") {
      setSearchScope("all");
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
          scope={searchScope}
          onScopeChange={setSearchScope}
          onSubmit={submitQuery}
        />

        {/* ══════════ TABS DE NAVEGACIÓN DEL CATÁLOGO ══════════ */}
        <MusicCatalogTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
      {!isSearchActive && activeTab === "radio" && (
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
      {!isSearchActive && activeTab === "top" && (
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

      {/* ══════════ RESULTADOS DE BÚSQUEDA (favoritas primero, luego YouTube) ══════════ */}
      {isSearchActive ? (
        <SearchResultsSection
          query={searchInput.trim()}
          scope={searchScope}
          favoritesCount={isPlaylistSearch ? playlistSearchGroups.userPlaylists.length : searchGroups.favorites.length}
          youtubeCount={isPlaylistSearch ? playlistSearchGroups.youtubePlaylists.length : searchGroups.youtube.length}
          paginatedSongs={isPlaylistSearch ? [] : (paginatedItems as Song[])}
          paginatedPlaylists={isPlaylistSearch ? (paginatedItems as UserPlaylist[]) : []}
          playlistsState={playlistsState}
          totalItems={isPlaylistSearch ? playlistSearchGroups.combined.length : searchGroups.combined.length}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          isSearching={isPlaylistSearch ? isSearchingPlaylists : isSearching}
          onPageChange={goToPage}
          onScopeChange={setSearchScope}
        />
      ) : (
        /* ══════════ LISTA DE CANCIONES / PLAYLISTS / ESTADOS ══════════ */
        <MusicResultsSection
          activeTab={activeTab}
          topSubTab={topSubTab}
          favoritesCount={favorites.length}
          isLoadingFavorites={isLoadingFavorites}
          isLoadingRecs={isLoadingRecs}
          songsCount={recSongs.length}
          displayedSongs={displayedSongs}
          paginatedSongs={paginatedItems as Song[]}
          playlistsState={playlistsState}
          searchInput={searchInput}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={goToPage}
          onExploreSuggestions={() => handleTabChange("radio")}
        />
      )}
    </div>
  );
}
