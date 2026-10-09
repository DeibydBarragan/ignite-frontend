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
import {
  Search,
  Link2,
  Plus,
  Play,
  ListMusic,
  Trash2,
  Clock,
  Loader2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Music2,
  RefreshCw,
} from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function totalDuration(tracks: Song[]) {
  return tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
}

interface LiveState {
  playlistId: string;
  status: "loading" | "ok" | "error";
  tracks: Song[];
  truncated: boolean;
}

/** Portada con placeholder shimmer mientras carga la imagen. */
function CoverImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setBroken(false);
  }, [src]);

  return (
    <span className={`relative block overflow-hidden bg-black/5 dark:bg-white/5 ${className}`}>
      {(!loaded || broken) && (
        <span className="absolute inset-0 ignite-shimmer flex items-center justify-center">
          <Music2 size={14} className="text-slate-400/60" />
        </span>
      )}
      {!broken && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={failed ? FALLBACK_COVER : src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!failed) setFailed(true);
            else setBroken(true);
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
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
    addToQueue,
    importUrlSong,
    isPlayerBusy,
  } = useBot();

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [selected, setSelected] = useState<UserPlaylist | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
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
      showFeedback("error", "Pega un enlace válido de Spotify, YouTube o SoundCloud.");
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

  const handleDelete = async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setLive(null);
    }
    await deleteUserPlaylist(id);
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
                <span>Guardando...</span>
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
              ? "Pega un enlace de Spotify, YouTube o SoundCloud arriba para guardar tu primera playlist."
              : `Sin coincidencias para "${search}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((pl) => {
            const isPlayingThis = playingId === pl.id;
            const isQueueingThis = queueingId === pl.id;
            const neverSynced = pl.tracks.length === 0;
            return (
              <div
                key={pl.id}
                className="glass-panel p-3.5 flex flex-col gap-3 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CoverImage
                    src={pl.cover}
                    alt={pl.name}
                    className="w-14 h-14 rounded-xl ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={pl.name}>
                      {pl.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {pl.source}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums flex items-center gap-1">
                        <Music2 size={10} />
                        {neverSynced ? "Sin sincronizar" : `${pl.tracks.length} temas`}
                      </span>
                    </div>
                    {!neverSynced && (
                      <p className="text-[10px] text-slate-400 font-mono tabular-nums mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        ~{formatDuration(totalDuration(pl.tracks))}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(pl.id)}
                    title="Eliminar playlist"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => openPlaylist(pl)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Ver temas</span>
                  </button>
                  <button
                    onClick={() => handlePlayPlaylist(pl)}
                    disabled={isPlayerBusy || isPlayingThis}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black flex items-center justify-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isPlayingThis ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} className="fill-current" />
                    )}
                    <span>{isPlayingThis ? "Sonando..." : "Reproducir"}</span>
                  </button>
                  <button
                    onClick={() => handleQueuePlaylist(pl)}
                    disabled={isPlayerBusy || isQueueingThis}
                    title="Añadir toda la playlist a la cola"
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium glass-btn text-slate-600 dark:text-slate-300 hover:text-[#1ed760] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isQueueingThis ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    <span>Cola</span>
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
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => handleQueuePlaylist(selected)}
                disabled={isPlayerBusy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium glass-btn text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus size={13} />
                <span>Añadir todo a la cola</span>
              </button>
              <button
                onClick={() => {
                  handlePlayPlaylist(selected);
                  closeModal();
                }}
                disabled={isPlayerBusy}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play size={13} className="fill-current" />
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
                <div className="px-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <RefreshCw size={12} className="animate-spin text-purple-400" />
                    <span>Sincronizando temas con {selected.source}...</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-label="Sincronizando playlist"
                  >
                    <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-purple-500 to-[#1ed760] ignite-progress-slide" />
                  </div>
                </div>
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
                          onClick={() => playSong(track)}
                          disabled={isPlayerBusy}
                          title={`Reproducir ${track.title}`}
                          className="p-1.5 rounded-lg hover:bg-[#1db954]/15 text-slate-400 hover:text-[#1ed760] transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Play size={13} />
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
    </div>
  );
}
