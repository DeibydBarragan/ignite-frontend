"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBot } from "@/context/bot-context";
import { igniteApi } from "@/lib/ignite-api";
import type { Song } from "@/lib/mock-data";
import {
  fetchUserPlaylists,
  createUserPlaylist,
  updatePlaylistSnapshot,
  deleteUserPlaylist,
  timeAgo,
  FALLBACK_COVER,
  type UserPlaylist,
} from "@/lib/playlists-service";
import { GlassModal } from "@/components/glass-modal";
import { DeletePlaylistModal } from "./delete-playlist-modal";
import { Button } from "@heroui/react";
import {
  Search,
  Link2,
  Plus,
  ListPlus,
  Play,
  ListMusic,
  Trash2,
  Clock,
  Loader2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Music2,
  Disc3,
  Star,
  ExternalLink,
} from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function totalDuration(tracks: Song[]) {
  return tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
}

const SOURCE_THEMES: Record<string, { label: string; badge: string; dot: string }> = {
  spotify: {
    label: "Spotify",
    badge: "bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/40",
    dot: "bg-[#1ed760]",
  },
  youtube: {
    label: "YouTube",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    dot: "bg-red-500",
  },
};

interface LiveState {
  playlistId: string;
  status: "loading" | "ok" | "error";
  tracks: Song[];
  truncated: boolean;
}

/** Portada con placeholder elegante de vinilo mientras carga la imagen. */
function CoverImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  iconSize = 18,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  iconSize?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const showPlaceholder = !src || failed || !loaded;

  return (
    <div className={`relative overflow-hidden bg-black/5 dark:bg-white/5 ${className}`}>
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-[#1b2030] dark:via-[#141724] dark:to-[#0d0f18] z-0">
          <Disc3 size={iconSize} className="text-slate-400 dark:text-purple-400/70 shrink-0" />
          <div className="absolute inset-0 ignite-shimmer opacity-15 pointer-events-none" />
        </div>
      )}
      {src && !failed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 relative z-10 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}

/** Filas esqueleto con la forma de la lista de temas. */
function TrackSkeletonRows({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2">
          <span className="text-[11px] font-mono text-slate-400/50 w-6 text-center shrink-0">
            {i + 1}
          </span>
          <span className="w-9 h-9 rounded-lg ignite-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-md ignite-shimmer" style={{ width: `${72 - (i % 3) * 12}%` }} />
            <div className="h-2 rounded-md ignite-shimmer" style={{ width: `${46 - (i % 2) * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlaylistsView() {
  const {
    user,
    selectedGuildId,
    playSong,
    playNext,
    addToQueue,
    importUrlSong,
    importPlaylistToFavorites,
    isFavorite,
    toggleFavorite,
    isPlayerBusy,
  } = useBot();

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importingFavId, setImportingFavId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [selected, setSelected] = useState<UserPlaylist | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<UserPlaylist | null>(null);
  const [favConfirmPlaylist, setFavConfirmPlaylist] = useState<UserPlaylist | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [queueingId, setQueueingId] = useState<string | null>(null);
  const liveForRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchUserPlaylists(user?.id)
      .then((data) => {
        if (mounted) setPlaylists(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return playlists;
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        p.tracks.some(
          (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
        )
    );
  }, [playlists, search]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Importar = guardar SOLO el link (instantáneo, sin resolver)
  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = importUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showFeedback("error", "Pega un enlace válido de Spotify o YouTube.");
      return;
    }
    if (url.toLowerCase().includes("soundcloud.com")) {
      showFeedback("error", "SoundCloud ya no está soportado. Usa un enlace de Spotify o YouTube.");
      return;
    }
    if (playlists.some((p) => p.url.trim().toLowerCase() === url.toLowerCase())) {
      showFeedback("error", "Esa playlist ya está en tu colección.");
      return;
    }
    setIsImporting(true);
    try {
      const created = await createUserPlaylist({
        url,
        name: importName.trim() || undefined,
        userId: user?.id,
      });
      setPlaylists((prev) => [created, ...prev]);
      setImportUrl("");
      setImportName("");
      showFeedback("success", `Playlist "${created.name}" guardada. Ábrela para sincronizar sus temas.`);
    } catch {
      showFeedback("error", "No se pudo guardar la playlist.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setLive(null);
    }
    await deleteUserPlaylist(id);
    if (name) {
      showFeedback("success", `Playlist "${name}" eliminada.`);
    }
  };

  // Abrir detalle = sincronizar con el estado ACTUAL de la plataforma
  const openPlaylist = async (pl: UserPlaylist) => {
    setSelected(pl);
    if (liveForRef.current === pl.id) return;
    liveForRef.current = pl.id;
    setLive({ playlistId: pl.id, status: "loading", tracks: [], truncated: false });
    try {
      const res = await igniteApi.resolvePlaylist(selectedGuildId, pl.url);
      if (!res.success || !res.tracks || res.tracks.length === 0) throw new Error("resolve failed");
      const cover = res.tracks[0]?.albumArt || pl.cover;
      await updatePlaylistSnapshot(pl.id, { tracks: res.tracks, cover });
      const synced_at = new Date().toISOString();
      setPlaylists((prev) =>
        prev.map((p) => (p.id === pl.id ? { ...p, tracks: res.tracks!, cover, synced_at } : p))
      );
      setSelected((prev) =>
        prev && prev.id === pl.id ? { ...prev, tracks: res.tracks!, cover, synced_at } : prev
      );
      setLive({ playlistId: pl.id, status: "ok", tracks: res.tracks, truncated: false });
    } catch {
      // Fallback: mostrar el último snapshot conocido
      setLive({ playlistId: pl.id, status: "error", tracks: [], truncated: false });
    }
  };

  const closeModal = () => {
    setSelected(null);
    setLive(null);
    liveForRef.current = null;
  };

  // Reproducir / encolar SIEMPRE por URL (una sola llamada, versión actual)
  const handlePlayPlaylist = async (pl: UserPlaylist) => {
    if (isPlayerBusy) return;
    setPlayingId(pl.id);
    try {
      const res = await importUrlSong(pl.url, { skip: true });
      showFeedback(res.success ? "success" : "error", res.success ? `Reproduciendo "${pl.name}".` : res.message);
    } finally {
      setPlayingId(null);
    }
  };

  const handleQueuePlaylist = async (pl: UserPlaylist) => {
    if (isPlayerBusy) return;
    setQueueingId(pl.id);
    try {
      const res = await importUrlSong(pl.url);
      showFeedback(res.success ? "success" : "error", res.success ? `"${pl.name}" añadida a la cola.` : res.message);
    } finally {
      setQueueingId(null);
    }
  };

  const handleImportFavorites = async (pl: UserPlaylist) => {
    if (importingFavId) return;
    setImportingFavId(pl.id);
    try {
      const res = await importPlaylistToFavorites({ name: pl.name, url: pl.url });
      if (res.error) {
        showFeedback("error", res.error);
      } else if (res.added === 0) {
        showFeedback("success", "Esos temas ya estaban en tus favoritos.");
      } else {
        showFeedback(
          "success",
          `${res.added} tema(s) de "${pl.name}" guardados en favoritos${res.skipped > 0 ? ` (${res.skipped} ya estaban)` : ""}.`
        );
      }
    } finally {
      setImportingFavId(null);
    }
  };

  const modalTracks: Song[] =
    live?.status === "ok" && selected && live.playlistId === selected.id
      ? live.tracks
      : selected?.tracks || [];
  const isSyncing = !!selected && (!live || live.playlistId !== selected.id || live.status === "loading");
  const syncFailed = !!selected && !!live && live.playlistId === selected.id && live.status === "error";

  return (
    <div className="space-y-4">
      {/* Buscador de playlists */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar en tus playlists por nombre, artista o canción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Importar por link (solo se guarda el enlace) */}
      <form
        onSubmit={handleImport}
        className="glass-panel p-3.5 border border-black/5 dark:border-white/10 space-y-2.5"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Link2 size={14} className="text-purple-400" />
          <span>Importar playlist por enlace</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2">
          <input
            type="text"
            placeholder="https://open.spotify.com/playlist/..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            disabled={isImporting}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            disabled={isImporting}
            maxLength={60}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!importUrl.trim() || isImporting}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Guardando</span>
              </>
            ) : (
              <>
                <Plus size={13} />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Solo se guarda el enlace: los temas siempre se sincronizan con el estado actual de la playlist. Usa el comando{" "}
          <span className="font-mono font-semibold text-purple-400">playlists</span> en el bot para verlas en Discord.
        </p>
      </form>

      {feedback && (
        <div
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-[#1db954]/10 text-[#1ed760] border border-[#1db954]/25"
              : "bg-rose-500/10 text-rose-500 border border-rose-500/25"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Lista (pinta desde el snapshot, instantáneo) */}
      {isLoading ? (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-purple-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Cargando tus playlists...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          <ListMusic size={36} className="mx-auto text-purple-400/40 mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {playlists.length === 0 ? "Aún no tienes playlists" : "Sin resultados"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {playlists.length === 0
              ? "Pega un enlace de Spotify o YouTube arriba para guardar tu primera playlist."
              : `Sin coincidencias para "${search}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((pl) => {
            const isPlayingThis = playingId === pl.id;
            const isQueueingThis = queueingId === pl.id;
            const isImportingThisFav = importingFavId === pl.id;
            const isCardBusy = isPlayingThis || isQueueingThis || isImportingThisFav || isPlayerBusy;
            const neverSynced = pl.tracks.length === 0;
            const sourceKey = (pl.source || "").toLowerCase();
            const sourceTheme = SOURCE_THEMES[sourceKey] || {
              label: pl.source || "Playlist",
              badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
              dot: "bg-purple-400",
            };

            return (
              <div
                key={pl.id}
                className={`group relative glass-panel p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 ${
                  isPlayingThis
                    ? "border-[#1db954]/50 bg-[#1db954]/5 ring-1 ring-[#1db954]/30"
                    : "hover:border-purple-500/40"
                }`}
              >
                <div>
                  {/* Artwork Banner Container */}
                  <div
                    onClick={() => openPlaylist(pl)}
                    className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-3 bg-black/10 dark:bg-black/30 cursor-pointer select-none"
                  >
                    <CoverImage
                      src={pl.cover}
                      alt={pl.name}
                      className="w-full h-full"
                      iconSize={36}
                      imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Source Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-xs ${sourceTheme.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sourceTheme.dot}`} />
                        {sourceTheme.label}
                      </span>
                    </div>

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistToDelete(pl);
                      }}
                      disabled={isCardBusy}
                      title="Eliminar playlist"
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-rose-500/80 text-white/70 hover:text-white backdrop-blur-md border border-white/10 hover:border-rose-400/50 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-xs ${
                        isCardBusy ? "cursor-not-allowed opacity-30 pointer-events-none" : "cursor-pointer"
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Track count pill */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 z-10 pointer-events-none">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1 shadow-xs">
                        <Music2 size={11} className="text-purple-400" />
                        {neverSynced ? "Sin sincronizar" : `${pl.tracks.length} temas`}
                      </span>
                    </div>

                    {/* Equalizer overlay when playing */}
                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-1.5 z-10">
                        <span className="w-1.5 h-6 bg-[#1ed760] rounded-full animate-pulse" />
                        <span className="w-1.5 h-8 bg-purple-400 rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-1.5 h-5 bg-[#1ed760] rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    )}

                    {/* Quick Add-to-Queue Floating Button (como en la tarjeta de canción) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQueuePlaylist(pl);
                      }}
                      disabled={isCardBusy}
                      aria-label={`Añadir ${pl.name} a la cola`}
                      title="Añadir toda la playlist a la cola"
                      className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#1db954] text-black shadow-lg shadow-[#1db954]/30 flex items-center justify-center transition-all duration-300 transform z-10 ${
                        isQueueingThis
                          ? "opacity-100 scale-100 cursor-not-allowed"
                          : isCardBusy
                          ? "opacity-0 pointer-events-none"
                          : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:scale-110 active:scale-95 hover:bg-[#1ed760] cursor-pointer"
                      }`}
                    >
                      {isQueueingThis ? (
                        <Loader2 size={18} className="animate-spin text-black" />
                      ) : (
                        <Plus size={20} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <div className="mb-2">
                    <h4
                      onClick={() => openPlaylist(pl)}
                      className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-purple-400 dark:hover:text-purple-300 transition-colors"
                      title={pl.name}
                    >
                      {pl.name}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                      {!neverSynced ? (
                        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-400">
                          <Clock size={11} />
                          ~{formatDuration(totalDuration(pl.tracks))}
                        </span>
                      ) : (
                        <span className="text-amber-500/90 dark:text-amber-400/90 text-[10px]">
                          No sincronizada
                        </span>
                      )}
                      {pl.synced_at && (
                        <span className="text-[10px] text-slate-400/70 dark:text-slate-500">
                          {timeAgo(pl.synced_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Tracks preview */}
                  {pl.tracks.length > 0 ? (
                    <p
                      className="text-[11px] text-slate-500 dark:text-slate-400/80 truncate mb-3"
                      title={pl.tracks.slice(0, 4).map((t) => t.title).join(" • ")}
                    >
                      {pl.tracks.slice(0, 3).map((t) => t.title).join(" • ")}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400/60 dark:text-slate-500 italic truncate mb-3">
                      Abre la playlist para sincronizar sus temas
                    </p>
                  )}
                </div>

                {/* Streamlined Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 border-t border-black/5 dark:border-white/5 mt-auto">
                  <button
                    type="button"
                    onClick={() => openPlaylist(pl)}
                    className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap min-w-0"
                    title="Ver temas de la playlist"
                  >
                    <Eye size={13} className="shrink-0" />
                    <span className="truncate">Ver temas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayPlaylist(pl)}
                    disabled={isCardBusy}
                    title={isPlayingThis ? "Sonando ahora" : "Reproducir playlist ahora"}
                    aria-label={`Reproducir ${pl.name}`}
                    className="h-8.5 w-8.5 rounded-xl text-xs font-semibold bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                  >
                    {isPlayingThis ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} className="fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQueuePlaylist(pl)}
                    disabled={isCardBusy}
                    title="Añadir toda la playlist a la cola"
                    aria-label={`Añadir ${pl.name} a la cola`}
                    className="h-8.5 w-8.5 rounded-xl glass-btn text-slate-500 dark:text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isQueueingThis ? (
                      <Loader2 size={14} className="animate-spin text-emerald-400" />
                    ) : (
                      <Plus size={15} strokeWidth={2.2} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFavConfirmPlaylist(pl)}
                    disabled={isCardBusy || !!importingFavId}
                    title="Guardar todos los temas en favoritos"
                    aria-label={`Guardar temas de ${pl.name} en favoritos`}
                    className="h-8.5 w-8.5 rounded-xl glass-btn text-slate-500 dark:text-slate-300 hover:text-amber-400 hover:border-amber-400/30 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {importingFavId === pl.id ? (
                      <Loader2 size={14} className="animate-spin text-amber-400" />
                    ) : (
                      <Star size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle (sincroniza en vivo al abrir) */}
      <GlassModal
        isOpen={!!selected}
        onClose={closeModal}
        maxWidth="lg"
        icon={<ListMusic size={20} />}
        title={selected?.name || "Playlist"}
        subtitle={
          selected
            ? isSyncing
              ? "Sincronizando con el estado actual de la playlist…"
              : `${modalTracks.length} temas — ~${formatDuration(totalDuration(modalTracks))} — ${selected.source} · ${timeAgo(selected.synced_at)}`
            : undefined
        }
        footer={
          selected && !isSyncing && modalTracks.length > 0 ? (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              {/* Botones secundarios (favs, cola, link) */}
              <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Abrir playlist en ${selected.source}`}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium glass-btn text-slate-400 hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <ExternalLink size={13} />
                  <span className="hidden md:inline">Abrir en {selected.source}</span>
                </a>

                <button
                  onClick={() => selected && setFavConfirmPlaylist(selected)}
                  disabled={!!importingFavId}
                  title="Guardar todos los temas en favoritos"
                  className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium glass-btn text-slate-700 dark:text-slate-200 hover:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {importingFavId ? (
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                  ) : (
                    <Star size={13} className="text-amber-400" />
                  )}
                  <span>Favoritos</span>
                </button>

                <button
                  onClick={() => handleQueuePlaylist(selected)}
                  disabled={isPlayerBusy}
                  title="Añadir todos los temas a la cola"
                  className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium glass-btn text-slate-700 dark:text-slate-200 hover:text-purple-400 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Plus size={13} className="text-purple-400" />
                  <span className="inline sm:hidden">A la cola</span>
                  <span className="hidden sm:inline">Añadir a la cola</span>
                </button>
              </div>

              {/* Botón primario: Reproducir todo */}
              <button
                onClick={() => {
                  handlePlayPlaylist(selected);
                  closeModal();
                }}
                disabled={isPlayerBusy}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1db954]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0 active:scale-[0.98]"
              >
                <Play size={14} className="fill-current" />
                <span>Reproducir todo</span>
              </button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-1.5">
            {isSyncing ? (
              <div className="space-y-3 py-2">
                <TrackSkeletonRows />
              </div>
            ) : (
              <>
                {syncFailed && (
                  <div className="px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/25 mb-1">
                    <AlertCircle size={13} />
                    <span>
                      No se pudo actualizar{selected.synced_at ? ` (última versión: ${timeAgo(selected.synced_at)})` : ""}. Mostrando última versión conocida.
                    </span>
                  </div>
                )}
                {modalTracks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No se encontraron temas. Revisa que la playlist sea pública.
                  </p>
                ) : (
                  modalTracks.map((track, idx) => (
                    <div
                      key={track.id + "-" + idx}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono text-slate-400 w-6 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <CoverImage
                          src={track.albumArt}
                          alt={track.title}
                          className="w-9 h-9 rounded-lg shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {track.artist} · {formatDuration(track.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleFavorite(track)}
                          title={isFavorite(track.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFavorite(track.id)
                              ? "text-amber-400 hover:text-amber-500"
                              : "hover:bg-amber-500/15 text-slate-400 hover:text-amber-400"
                          }`}
                        >
                          <Star size={13} className={isFavorite(track.id) ? "fill-amber-400" : ""} />
                        </button>
                        <button
                          onClick={() => playSong(track)}
                          disabled={isPlayerBusy}
                          title={`Reproducir ${track.title}`}
                          className="p-1.5 rounded-lg hover:bg-[#1db954]/15 text-slate-400 hover:text-[#1ed760] transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Play size={13} />
                        </button>
                        <button
                          onClick={() => playNext(track)}
                          disabled={isPlayerBusy}
                          title="Reproducir a continuación (saltar cola)"
                          className="p-1.5 rounded-lg hover:bg-purple-500/15 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <ListPlus size={13} />
                        </button>
                        <button
                          onClick={() => addToQueue(track)}
                          disabled={isPlayerBusy}
                          title="Añadir a la cola"
                          className="p-1.5 rounded-lg hover:bg-purple-500/15 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </GlassModal>

      {/* Modal de confirmación para guardar temas en favoritos */}
      <GlassModal
        isOpen={!!favConfirmPlaylist}
        onClose={() => !importingFavId && setFavConfirmPlaylist(null)}
        maxWidth="md"
        icon={<Star size={20} className="text-amber-400 fill-amber-400" />}
        title="Guardar en favoritos"
        subtitle={
          favConfirmPlaylist
            ? `¿Deseas guardar los temas de «${favConfirmPlaylist.name}»?`
            : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setFavConfirmPlaylist(null)}
              isDisabled={!!importingFavId}
              className="text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              isDisabled={!!importingFavId}
              onPress={async () => {
                if (!favConfirmPlaylist) return;
                const target = favConfirmPlaylist;
                setFavConfirmPlaylist(null);
                await handleImportFavorites(target);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {importingFavId ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : (
                <Star size={14} className="fill-black text-black" />
              )}
              <span>{importingFavId ? "Guardando" : "Confirmar y guardar"}</span>
            </Button>
          </div>
        }
      >
        {favConfirmPlaylist && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0">
                <CoverImage
                  src={favConfirmPlaylist.cover}
                  alt={favConfirmPlaylist.name}
                  className="w-full h-full"
                  iconSize={24}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {favConfirmPlaylist.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize">{favConfirmPlaylist.source}</span>
                  <span>•</span>
                  <span>
                    {favConfirmPlaylist.tracks.length > 0
                      ? `${favConfirmPlaylist.tracks.length} temas`
                      : "Todos los temas de la playlist"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta acción añadirá las canciones de esta playlist a tu lista de favoritos de Discord para que puedas escucharlas en cualquier momento sin tener que buscar la playlist completa.
            </p>
          </div>
        )}
      </GlassModal>

      {/* Modal para Confirmar Eliminación de Playlist */}
      <DeletePlaylistModal
        playlist={playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onDeleted={handleDelete}
      />
    </div>
  );
}
