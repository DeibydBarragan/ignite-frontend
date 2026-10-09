"use client";

import { useState, useMemo } from "react";
import { useBot } from "@/context/bot-context";
import { SongCard } from "@/components/music/song-card";
import {
  Search,
  Link2,
  Music2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";

function detectPlatform(text: string): "spotify" | "youtube" | "soundcloud" | null {
  const lower = text.toLowerCase();
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("soundcloud.com")) return "soundcloud";
  if (lower.startsWith("http://") || lower.startsWith("https://")) return "spotify";
  return null;
}

export function MusicView() {
  const { catalog, importUrlSong, isPlayerBusy, pendingAction } = useBot();
  const [searchInput, setSearchInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isImporting = isPlayerBusy && pendingAction === "queue";
  const detectedPlatform = useMemo(() => detectPlatform(searchInput.trim()), [searchInput]);
  const isUrl = detectedPlatform !== null;

  const filteredSongs = useMemo(() => {
    if (isUrl) return catalog; // When typing a URL, keep catalog intact
    const query = searchInput.toLowerCase().trim();
    if (!query) return catalog;
    return catalog.filter((song) => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.source.toLowerCase().includes(query)
      );
    });
  }, [catalog, searchInput, isUrl]);

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isPlayerBusy) return;
    const query = searchInput.trim();
    if (!query) return;

    try {
      const res = await importUrlSong(query);
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

  return (
    <div className="space-y-4 pb-28">
      {/* ══════════ COMANDO: BÚSQUEDA Y DETECCIÓN DE ENLACES ══════════ */}
      <div className="space-y-2">
        <form onSubmit={handleImport} className="relative flex items-center">
          <div className="relative flex-1 flex items-center">
            {isUrl ? (
              <Link2 size={16} className="absolute left-3.5 text-[#1ed760] transition-colors" />
            ) : (
              <Search size={16} className="absolute left-3.5 text-slate-400" />
            )}

            <input
              type="text"
              placeholder="Buscar por canción o pegar enlace de Spotify, YouTube o SoundCloud..."
              value={searchInput}
              disabled={isImporting}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`glass-input w-full pl-10 pr-28 sm:pr-36 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 ${
                isImporting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />

            {/* Platform badge & Direct action button */}
            {searchInput.trim().length > 0 && (
              <div className="absolute right-2 flex items-center gap-1.5">
                {isUrl && (
                  <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {detectedPlatform}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isPlayerBusy}
                  className={`px-3 py-1 rounded-lg bg-[#1db954] text-black text-xs font-semibold shadow-xs flex items-center gap-1 transition-all ${
                    isPlayerBusy
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-[#1ed760] active:scale-95 cursor-pointer"
                  }`}
                >
                  {isImporting ? (
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

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Catálogo de recomendaciones</span>
          <span className="tabular-nums font-mono">{filteredSongs.length} temas</span>
        </div>
      </div>

      {/* ══════════ CATÁLOGO MUSICAL ══════════ */}
      {filteredSongs.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <Music2 size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Sin resultados para &ldquo;{searchInput}&rdquo;
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Puedes pegar un enlace directo de Spotify, YouTube o SoundCloud para reproducirlo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
