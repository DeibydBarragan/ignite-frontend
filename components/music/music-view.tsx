"use client";

import { useState, useMemo } from "react";
import { useBot } from "@/context/bot-context";
import { SongCard } from "@/components/music/song-card";
import { MusicSource } from "@/lib/mock-data";
import {
  Search,
  Link2,
  Music2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Radio,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "synthwave", label: "Synthwave" },
  { id: "lofi", label: "Lo-Fi" },
  { id: "gaming", label: "Gaming" },
  { id: "hits", label: "Éxitos" },
  { id: "rock", label: "Rock" },
];

const PROVIDERS: {
  id: MusicSource;
  label: string;
  dotColor: string;
  badgeStyle: string;
}[] = [
  {
    id: "spotify",
    label: "Spotify",
    dotColor: "bg-[#1db954]",
    badgeStyle: "text-[#1ed760] bg-[#1db954]/10 border-[#1db954]/30",
  },
  {
    id: "youtube",
    label: "YouTube",
    dotColor: "bg-red-500",
    badgeStyle: "text-red-500 bg-red-500/10 border-red-500/30",
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    dotColor: "bg-amber-500",
    badgeStyle: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
];

function detectPlatform(text: string): "spotify" | "youtube" | "soundcloud" | null {
  const lower = text.toLowerCase();
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("soundcloud.com")) return "soundcloud";
  if (lower.startsWith("http://") || lower.startsWith("https://")) return "spotify";
  return null;
}

export function MusicView() {
  const { catalog, importUrlSong, defaultProvider, setDefaultProvider } = useBot();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const detectedPlatform = useMemo(() => detectPlatform(searchInput.trim()), [searchInput]);
  const isUrl = detectedPlatform !== null;

  const filteredSongs = useMemo(() => {
    if (isUrl) return catalog; // When typing a URL, keep catalog intact
    const query = searchInput.toLowerCase().trim();
    return catalog.filter((song) => {
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.source.toLowerCase().includes(query);

      const matchesCat = selectedCategory === "all" || song.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [catalog, searchInput, selectedCategory, isUrl]);

  const handleImport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    const res = importUrlSong(query);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setSearchInput("");
    } else {
      setFeedback({ type: "error", message: res.message });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const activeProviderMeta = PROVIDERS.find((p) => p.id === defaultProvider) || PROVIDERS[0];

  return (
    <div className="space-y-5 pb-28">
      {/* ══════════ PROVEEDOR PREDETERMINADO & COMANDO ══════════ */}
      <div className="space-y-3">
        {/* Selector de Proveedor Predeterminado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Proveedor predeterminado:
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              (usado para comandos /play y búsquedas de texto directo)
            </span>
          </div>

          {/* Toggle de proveedores */}
          <div className="p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 flex items-center gap-1 self-start sm:self-auto">
            {PROVIDERS.map((prov) => {
              const isSelected = defaultProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setDefaultProvider(prov.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    isSelected
                      ? `bg-white dark:bg-[#141624] font-medium shadow-xs border border-black/5 dark:border-white/10 ${prov.badgeStyle}`
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${prov.dotColor}`} />
                  <span>{prov.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Búsqueda y Detección de Enlaces */}
        <form onSubmit={handleImport} className="relative flex items-center">
          <div className="relative flex-1 flex items-center">
            {isUrl ? (
              <Link2 size={16} className="absolute left-3.5 text-[#1ed760] transition-colors" />
            ) : (
              <Search size={16} className="absolute left-3.5 text-slate-400" />
            )}

            <input
              type="text"
              placeholder={`Buscar por título (predeterminado: ${activeProviderMeta.label}) o pegar link de Spotify, YouTube o SoundCloud...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="glass-input w-full pl-10 pr-28 sm:pr-40 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
            />

            {/* Platform badge & Direct action button */}
            {searchInput.trim().length > 0 && (
              <div className="absolute right-2 flex items-center gap-1.5">
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  {isUrl ? detectedPlatform : defaultProvider}
                </span>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-semibold shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Encolar</span>
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

        {/* Categories Bar & Counter */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`glass-pill px-3 py-1 text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id ? "glass-pill-active" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 tabular-nums shrink-0 hidden sm:inline">
            {filteredSongs.length} temas disponibles
          </span>
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
            Puedes presionar &ldquo;Encolar&rdquo; para buscar esta pista directamente en {activeProviderMeta.label}.
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
