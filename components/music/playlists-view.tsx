"use client";

import { useEffect, useMemo, useState } from "react";
import { useBot } from "@/context/bot-context";
import { igniteApi } from "@/lib/ignite-api";
import {
  fetchUserPlaylists,
  createUserPlaylist,
  deleteUserPlaylist,
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
} from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function totalDuration(pl: UserPlaylist) {
  return pl.tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
}

export function PlaylistsView() {
  const {
    user,
    selectedGuildId,
    playSong,
    addToQueue,
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [queueingId, setQueueingId] = useState<string | null>(null);

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

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = importUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showFeedback("error", "Pega un enlace válido de Spotify, YouTube o SoundCloud.");
      return;
    }
    setIsImporting(true);
    try {
      // Intentar resolver tracks en el backend (si el endpoint existe)
      let resolved: UserPlaylist["tracks"] | undefined;
      try {
        const res = await igniteApi.resolvePlaylist(selectedGuildId, url);
        if (res.success && res.tracks && res.tracks.length > 0) resolved = res.tracks;
      } catch {
        // fallback local
      }
      const created = await createUserPlaylist({
        url,
        name: importName.trim() || undefined,
        userId: user?.id,
        resolvedTracks: resolved,
      });
      setPlaylists((prev) => [created, ...prev]);
      setImportUrl("");
      setImportName("");
      showFeedback("success", `Playlist "${created.name}" guardada (${created.tracks.length} temas).`);
    } catch {
      showFeedback("error", "No se pudo importar la playlist.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await deleteUserPlaylist(id);
  };

  const handlePlayPlaylist = async (pl: UserPlaylist) => {
    if (isPlayerBusy || pl.tracks.length === 0) return;
    setPlayingId(pl.id);
    try {
      const [first, ...rest] = pl.tracks;
      await playSong(first);
      for (const track of rest) {
        await addToQueue(track);
      }
    } finally {
      setPlayingId(null);
    }
  };

  const handleQueuePlaylist = async (pl: UserPlaylist) => {
    if (pl.tracks.length === 0) return;
    setQueueingId(pl.id);
    try {
      for (const track of pl.tracks) {
        await addToQueue(track);
      }
      showFeedback("success", `"${pl.name}" añadida a la cola (${pl.tracks.length} temas).`);
    } finally {
      setQueueingId(null);
    }
  };

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

      {/* Importar por link */}
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
          Podrás reproducirla o añadirla a la cola. Usa el comando{" "}
          <span className="font-mono font-semibold text-purple-400">playlists</span> en el bot para verlas en Discord (próximamente).
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

      {/* Lista */}
      {isLoading ? (
        <div className="p-12 text-center glass-panel">
          <Loader2 size={28} className="mx-auto text-purple-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Cargando tus playlists desde Supabase...</p>
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
            return (
              <div
                key={pl.id}
                className="glass-panel p-3.5 flex flex-col gap-3 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pl.cover}
                    alt={pl.name}
                    className="w-14 h-14 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={pl.name}>
                        {pl.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {pl.source}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums flex items-center gap-1">
                        <Music2 size={10} />
                        {pl.tracks.length} temas
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono tabular-nums mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      ~{formatDuration(totalDuration(pl))}
                    </p>
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
                    onClick={() => setSelected(pl)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Ver temas</span>
                  </button>
                  <button
                    onClick={() => handlePlayPlaylist(pl)}
                    disabled={isPlayerBusy || isPlayingThis || pl.tracks.length === 0}
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
                    disabled={isQueueingThis || pl.tracks.length === 0}
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

      {/* Modal detalle */}
      <GlassModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="lg"
        icon={<ListMusic size={20} />}
        title={selected?.name || "Playlist"}
        subtitle={
          selected
            ? `${selected.tracks.length} temas — ~${formatDuration(totalDuration(selected))} — ${selected.source}`
            : undefined
        }
        footer={
          selected ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => handleQueuePlaylist(selected)}
                disabled={queueingId === selected.id}
                className="px-3 py-1.5 rounded-lg text-xs font-medium glass-btn text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus size={13} />
                <span>Añadir todo a la cola</span>
              </button>
              <button
                onClick={() => {
                  handlePlayPlaylist(selected);
                  setSelected(null);
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
            {selected.tracks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Esta playlist no tiene temas.</p>
            ) : (
              selected.tracks.map((track, idx) => (
                <div
                  key={track.id + "-" + idx}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-mono text-slate-400 w-6 text-center shrink-0">
                      {idx + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      loading="lazy"
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
                      title="Añadir a la cola"
                      className="p-1.5 rounded-lg hover:bg-purple-500/15 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </GlassModal>
    </div>
  );
}
