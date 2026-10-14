"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBot } from "@/context/bot-context";
import { igniteApi } from "@/lib/ignite-api";
import { Song, MOCK_SONGS } from "@/lib/mock-data";
import { SongCard } from "@/components/music/song-card";
import { PlaylistsView } from "@/components/music/playlists-view";
import {
  Search,
  Link2,
  Music2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ListPlus,
  Loader2,
  Star,
  Flame,
  Play,
  Sparkles,
  ListMusic,
  Radio,
  Trophy,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

function detectPlatform(text: string): "spotify" | "youtube" | null {
  const lower = text.toLowerCase();
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.startsWith("http://") || lower.startsWith("https://")) return "spotify";
  return null;
}

export function MusicView() {
  const {
    favorites,
    isLoadingFavorites,
    playFavorites,
    importUrlSong,
    isPlayerBusy,
    pendingAction,
    selectedGuildId,
    currentSong,
    playSong,
    addToQueue,
  } = useBot();

  const [activeTab, setActiveTab] = useState<"favorites" | "catalog" | "playlists">("favorites");
  const [recSubTab, setRecSubTab] = useState<"radio" | "week" | "month" | "all">("radio");
  const [recSongs, setRecSongs] = useState<Song[]>([]);
  const [basedOnSong, setBasedOnSong] = useState<Song | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecs = useCallback(
    async (mode: "radio" | "week" | "month" | "all") => {
      if (!selectedGuildId) return;
      setIsLoadingRecs(true);
      try {
        if (mode === "radio") {
          const res = await igniteApi.getRecommendations(selectedGuildId);
          if (res.success && res.songs.length > 0) {
            setRecSongs(res.songs);
            setBasedOnSong(res.basedOn);
          } else {
            setRecSongs(MOCK_SONGS);
            setBasedOnSong(null);
          }
        } else {
          const res = await igniteApi.getTopSongs(selectedGuildId, mode);
          if (res.success && res.songs.length > 0) {
            setRecSongs(res.songs);
          } else {
            setRecSongs([]);
          }
          setBasedOnSong(null);
        }
      } catch (err) {
        console.error("Error loading recommendations:", err);
        if (mode === "radio") {
          setRecSongs(MOCK_SONGS);
        } else {
          setRecSongs([]);
        }
      } finally {
        setIsLoadingRecs(false);
      }
    },
    [selectedGuildId]
  );

  useEffect(() => {
    if (activeTab === "catalog") {
      fetchRecs(recSubTab);
    }
  }, [activeTab, recSubTab, fetchRecs]);

  // Si cambia la canción en reproducción y estamos en la radio, actualizar las recomendaciones afines
  useEffect(() => {
    if (activeTab === "catalog" && recSubTab === "radio" && currentSong?.id) {
      fetchRecs("radio");
    }
  }, [currentSong?.id, activeTab, recSubTab, fetchRecs]);

  const playAllRecs = async () => {
    if (isPlayerBusy || recSongs.length === 0) return;
    const [first, ...rest] = recSongs;
    await playSong(first);
    for (const song of rest) {
      await addToQueue(song);
    }
  };

  const isImporting = isPlayerBusy && (pendingAction === "queue" || pendingAction === "playNext");
  const detectedPlatform = useMemo(() => detectPlatform(searchInput.trim()), [searchInput]);
  const isUrl = detectedPlatform !== null;

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

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await submitQuery(searchInput);
  };

  const submitQuery = async (rawQuery: string, opts?: { next?: boolean }) => {
    if (isPlayerBusy) return;
    const query = rawQuery.trim();
    if (!query) return;

    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const res = await importUrlSong(query, { next: opts?.next });
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        setSearchInput("");
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } catch {
      setFeedback({ type: "error", message: "Ocurrió un error al procesar la canción." });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Sugerencias de YouTube (igual que el autocompletado de /play en Discord).
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const q = searchInput.trim();
    if (isUrl || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      const items = await igniteApi.getSuggestions(q);
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    }, 300);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, [searchInput, isUrl]);

  return (
    <div className="space-y-4 pb-28">
      {/* ══════════ COMANDO: BÚSQUEDA Y DETECCIÓN DE ENLACES ══════════ */}
      <div className="space-y-3">
        <form onSubmit={handleImport} className="relative flex items-center">
          <div className="relative flex-1 flex items-center">
            {isUrl ? (
              <Link2 size={16} className="absolute left-3.5 text-[#1ed760] transition-colors" />
            ) : (
              <Search size={16} className="absolute left-3.5 text-slate-400" />
            )}

            <input
              type="text"
              placeholder="Buscar por canción o pegar enlace de Spotify o YouTube..."
              value={searchInput}
              disabled={isImporting}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSuggestions(false);
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
                  onClick={() => submitQuery(searchInput, { next: true })}
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
                      <span>Sig...</span>
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
                      <span>Encolando...</span>
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

          {/* Sugerencias de YouTube (igual que /play en Discord) */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 glass-panel p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
              {suggestions.map((s) => (
                <div
                  key={s}
                  className="w-full px-2 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-slate-900 dark:hover:text-white flex items-center justify-between gap-2 transition-colors group/item"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchInput(s);
                      submitQuery(s);
                    }}
                    className="flex-1 flex items-center gap-2 text-left cursor-pointer truncate"
                  >
                    <Search size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchInput(s);
                      submitQuery(s, { next: true });
                    }}
                    title="Reproducir siguiente (salta la cola)"
                    className="opacity-0 group-hover/item:opacity-100 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <ListPlus size={11} />
                    <span>Siguiente</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
              feedback.type === "success"
                ? "bg-[#1db954]/10 text-[#1ed760] border border-[#1db954]/25"
                : "bg-rose-500/10 text-rose-500 border border-rose-500/25"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ══════════ TABS DE NAVEGACIÓN DEL CATÁLOGO ══════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full min-w-0 pb-0.5">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "favorites"
                  ? "glass-pill-active font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Star
                size={13}
                className={
                  activeTab === "favorites" ? "fill-amber-400 text-amber-400" : ""
                }
              />
              <span>Mis Favoritos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/15 text-amber-400 font-mono font-bold">
                {favorites.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "catalog"
                  ? "glass-pill-active font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame
                size={13}
                className={activeTab === "catalog" ? "text-purple-400" : ""}
              />
              <span>Recomendadas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-400 font-mono">
                {recSongs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("playlists")}
              className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "playlists"
                  ? "glass-pill-active font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListMusic
                size={13}
                className={activeTab === "playlists" ? "text-emerald-400" : ""}
              />
              <span>Playlists</span>
            </button>
          </div>

          {/* Action button: Play all favorites */}
          {activeTab === "favorites" && favorites.length > 0 && (
            <button
              onClick={playFavorites}
              disabled={isPlayerBusy}
              className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              <Play size={12} className="fill-current" />
              <span>Reproducir todos mis favoritos</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════ SUB-CABECERA DE RECOMENDADAS & RANKINGS ══════════ */}
      {activeTab === "catalog" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-1.5 rounded-2xl glass-panel">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full min-w-0">
            <button
              onClick={() => setRecSubTab("radio")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                recSubTab === "radio"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Radio size={12} className={currentSong ? "text-emerald-300 animate-pulse" : ""} />
              <span>Radio en vivo</span>
              {currentSong && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
            </button>

            <button
              onClick={() => setRecSubTab("week")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                recSubTab === "week"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Flame size={12} className="text-amber-400" />
              <span>Top Semanal</span>
            </button>

            <button
              onClick={() => setRecSubTab("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                recSubTab === "month"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <CalendarDays size={12} className="text-sky-400" />
              <span>Top Mensual</span>
            </button>

            <button
              onClick={() => setRecSubTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                recSubTab === "all"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Trophy size={12} className="text-amber-400" />
              <span>De siempre</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => fetchRecs(recSubTab)}
              disabled={isLoadingRecs}
              title="Refrescar recomendaciones"
              className="glass-btn p-1.5 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 cursor-pointer rounded-lg"
            >
              <RefreshCw size={13} className={isLoadingRecs ? "animate-spin text-purple-400" : ""} />
            </button>

            {recSongs.length > 0 && (
              <button
                onClick={playAllRecs}
                disabled={isPlayerBusy}
                className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-[#1ed760] border-[#1db954]/30 hover:bg-[#1db954]/10 cursor-pointer disabled:opacity-50 font-semibold"
              >
                <Play size={11} className="fill-current" />
                <span>
                  {recSubTab === "radio" ? "Reproducir Radio" : "Reproducir todo el Top"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════ BANNER INSPIRACIÓN RADIO EN VIVO ══════════ */}
      {activeTab === "catalog" && recSubTab === "radio" && basedOnSong && (
        <div className="p-3 rounded-2xl glass-panel border border-purple-500/25 bg-purple-500/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/20 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={basedOnSong.albumArt} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Radio en vivo generada a partir de
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {basedOnSong.title}{" "}
                <span className="font-normal text-slate-500 dark:text-slate-400">— {basedOnSong.artist}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LISTA DE CANCIONES / PLAYLISTS / ESTADOS ══════════ */}
      {activeTab === "playlists" ? (
        <PlaylistsView />
      ) : isLoadingFavorites && activeTab === "favorites" ? (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-amber-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Cargando tus favoritos desde Supabase...</p>
        </div>
      ) : activeTab === "favorites" && favorites.length === 0 ? (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <Star size={36} className="mx-auto text-amber-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Aún no tienes canciones favoritas
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Presiona el botón <span className="font-semibold text-amber-400">⭐ Favorito</span> en Discord mientras escuchas música, o guarda canciones desde las recomendaciones.
          </p>
          <button
            onClick={() => setActiveTab("catalog")}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Explorar sugerencias</span>
          </button>
        </div>
      ) : activeTab === "catalog" && isLoadingRecs ? (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-purple-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">
            {recSubTab === "radio" ? "Sintonizando radio contextual..." : "Cargando el ranking del servidor..."}
          </p>
        </div>
      ) : activeTab === "catalog" && recSongs.length === 0 ? (
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
      ) : displayedSongs.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <Music2 size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Sin resultados para &ldquo;{searchInput}&rdquo;
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Puedes pegar un enlace directo de Spotify o YouTube para reproducirlo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {displayedSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
