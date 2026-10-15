"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useBot } from "@/context/bot-context";
import { SoundItem, SoundCategory } from "@/lib/mock-data";
import { AddSoundModal } from "@/components/soundboard/add-sound-modal";
import { EditSoundModal } from "@/components/soundboard/edit-sound-modal";
import { DeleteSoundModal } from "@/components/soundboard/delete-sound-modal";
import {
  Volume2,
  Play,
  Plus,
  Search,
  Activity,
  Radio,
  Upload,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";

function formatRelativeTime(ts: number | null | undefined): string | null {
  if (!ts) return null;
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return "Ahora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

const CATEGORIES: { id: "all" | SoundCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "memes", label: "Memes" },
  { id: "gaming", label: "Gaming" },
  { id: "reactions", label: "Reacciones" },
  { id: "sfx", label: "Efectos" },
  { id: "anime", label: "Anime" },
];

export function SoundboardView() {
  const {
    user,
    sounds,
    activeSoundId,
    playSound,
    attachSoundAudio,
    liveEvents,
    clearLiveEvents,
  } = useBot();

  const [searchSound, setSearchSound] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | SoundCategory>("all");
  const [soundScope, setSoundScope] = useState<"all" | "mine" | "public">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "alpha">("recent");
  const [isAddSoundOpen, setIsAddSoundOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<SoundItem | null>(null);
  const [deletingSound, setDeletingSound] = useState<SoundItem | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachTargetRef = useRef<string | null>(null);

  const ATTACH_EXTS = [".mp3", ".ogg", ".oga", ".wav", ".webm", ".m4a"];
  const ATTACH_MAX_BYTES = 5 * 1024 * 1024;

  const triggerAttach = (soundId: string) => {
    attachTargetRef.current = soundId;
    fileInputRef.current?.click();
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const targetId = attachTargetRef.current;
    attachTargetRef.current = null;
    if (!file || !targetId || isAttaching) return;

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ATTACH_EXTS.includes(ext)) return;
    if (file.size > ATTACH_MAX_BYTES) return;

    setIsAttaching(true);
    await attachSoundAudio(targetId, file);
    setIsAttaching(false);
  };

  const isSoundMine = useCallback(
    (s: SoundItem): boolean => {
      if (!s.uploadedBy || s.uploadedBy.trim() === "" || s.uploadedBy === "null") return false;
      const uid = s.uploadedBy.trim();
      if (uid === "local-user" || uid === "750899475404292126") return true;
      if (user?.id && uid === user.id) return true;
      if (!user) return true;
      return false;
    },
    [user]
  );

  const mySounds = useMemo(() => {
    return sounds.filter(isSoundMine);
  }, [sounds, isSoundMine]);

  const publicSounds = useMemo(() => {
    return sounds.filter((s) => !isSoundMine(s));
  }, [sounds, isSoundMine]);

  const scopeSounds = useMemo(() => {
    if (soundScope === "mine") return mySounds;
    if (soundScope === "public") return publicSounds;
    return sounds;
  }, [soundScope, mySounds, publicSounds, sounds]);

  const filteredSounds = useMemo(() => {
    const list = scopeSounds.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchSound.toLowerCase());
      const matchesCat = selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "recent") {
        const timeA = a.lastPlayedAt ?? 0;
        const timeB = b.lastPlayedAt ?? 0;
        if (timeA !== timeB) return timeB - timeA;
        if ((b.playsCount ?? 0) !== (a.playsCount ?? 0)) {
          return (b.playsCount ?? 0) - (a.playsCount ?? 0);
        }
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "popular") {
        if ((b.playsCount ?? 0) !== (a.playsCount ?? 0)) {
          return (b.playsCount ?? 0) - (a.playsCount ?? 0);
        }
        return (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0);
      }
      if (sortBy === "alpha") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [scopeSounds, searchSound, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      {/* ═══════════════════ PARTE 1: CATÁLOGO DE SOUNDBOARD ═══════════════════ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Soundboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic sobre cualquier pad para emitir el efecto al canal de voz.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsAddSoundOpen(true)}
              className="glass-btn px-3 py-1.5 text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-500 border-purple-500/20"
            >
              <Plus size={14} />
              <span>Añadir sonido</span>
            </button>
          </div>
        </div>

        {/* Scope tabs: Todos / Propios / De todos */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundScope("all")}
            className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              soundScope === "all"
                ? "glass-pill-active font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-400 font-mono">
              {sounds.length}
            </span>
          </button>
          <button
            onClick={() => setSoundScope("mine")}
            className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              soundScope === "mine"
                ? "glass-pill-active font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Propios</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-mono font-bold">
              {mySounds.length}
            </span>
          </button>
          <button
            onClick={() => setSoundScope("public")}
            className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              soundScope === "public"
                ? "glass-pill-active font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>De todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/15 text-blue-400 font-mono font-bold">
              {publicSounds.length}
            </span>
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`glass-pill px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? "glass-pill-active" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar sonido..."
                value={searchSound}
                onChange={(e) => setSearchSound(e.target.value)}
                className="glass-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1 text-xs shrink-0 border border-black/10 dark:border-white/10" title="Ordenar audios">
              <Clock size={12} className="text-purple-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "popular" | "alpha")}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
                title="Ordenar audios"
              >
                <option value="recent" className="dark:bg-slate-900">Más recientes</option>
                <option value="popular" className="dark:bg-slate-900">Más usados</option>
                <option value="alpha" className="dark:bg-slate-900">A - Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* MPC Audio Sampler Grid */}
        {filteredSounds.length === 0 ? (
          <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
            <Volume2 size={36} className="mx-auto text-purple-400/40 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {soundScope === "mine" && !searchSound && selectedCategory === "all"
                ? "Aún no tienes sonidos propios"
                : soundScope === "public" && !searchSound && selectedCategory === "all"
                ? "No hay sonidos comunitarios"
                : "Sin resultados"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {soundScope === "mine" && !searchSound && selectedCategory === "all"
                ? "Usa «Añadir sonido» con un .mp3 o edita uno existente y márcalo como «Propio»."
                : soundScope === "public" && !searchSound && selectedCategory === "all"
                ? "Los sonidos de serie o marcados como «De todos» aparecerán aquí."
                : "Prueba con otro nombre o categoría."}
            </p>
            {soundScope === "mine" && !searchSound && selectedCategory === "all" && (
              <button
                onClick={() => setIsAddSoundOpen(true)}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Subir mi primer sonido</span>
              </button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredSounds.map((snd) => {
            const isPlayingThis = activeSoundId === snd.id;
            const isMine = isSoundMine(snd);

            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => playSound(snd.id)}
                className={`group text-left relative glass-panel p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer active:scale-95 ${
                  isPlayingThis
                    ? "border-[#1db954] bg-[#1db954]/10 ring-1 ring-[#1db954]/50 shadow-sm"
                    : "hover:border-purple-500/30 dark:hover:border-purple-500/30"
                }`}
              >
                <div className="flex items-start justify-between w-full mb-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 ${
                      isPlayingThis
                        ? "bg-[#1db954] text-black"
                        : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10"
                    }`}
                  >
                    {snd.emoji ? snd.emoji : <Volume2 size={20} className="text-purple-400" />}
                  </div>

                  {isPlayingThis ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1db954]" />
                    </span>
                  ) : snd.lastPlayedAt ? (
                    <span
                      className="text-[9px] font-sans text-slate-400 dark:text-slate-500 flex items-center gap-0.5 shrink-0 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md"
                      title={`Último uso: ${formatRelativeTime(snd.lastPlayedAt)}`}
                    >
                      <Clock size={9} className="text-purple-400" />
                      <span>{formatRelativeTime(snd.lastPlayedAt)}</span>
                    </span>
                  ) : null}
                </div>

                <div className="w-full min-w-0">
                  <div
                    className="font-medium text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5"
                    title={`${snd.name}${snd.lastPlayedAt ? ` • Usado: ${formatRelativeTime(snd.lastPlayedAt)}` : ""}`}
                  >
                    <span className="truncate">{snd.name}</span>
                    {isMine && soundScope === "all" && (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        MÍO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 tabular-nums font-mono">
                    <span className="capitalize font-sans text-slate-500 dark:text-slate-400">
                      {snd.category}
                      {snd.hasFile && (
                        <span className="ml-1 not-italic font-sans font-semibold text-[#1db954]" title="Tiene audio real: suena en Discord">
                          · MP3
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        title="Editar nombre, emoji, categoría y ámbito"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEditingSound(snd);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.stopPropagation();
                            setEditingSound(snd);
                          }
                        }}
                        className="p-0.5 rounded transition-colors cursor-pointer text-slate-300 dark:text-slate-600 hover:text-purple-400"
                      >
                        <Pencil size={11} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title={snd.hasFile ? "Reemplazar audio MP3" : "Subir audio MP3 para que suene en Discord"}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          triggerAttach(snd.id);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.stopPropagation();
                            triggerAttach(snd.id);
                          }
                        }}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${snd.hasFile ? "text-[#1db954] hover:text-[#1ed760]" : "text-slate-300 dark:text-slate-600 hover:text-purple-400"}`}
                      >
                        <Upload size={11} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title="Eliminar sonido"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setDeletingSound(snd);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.stopPropagation();
                            setDeletingSound(snd);
                          }
                        }}
                        className="p-0.5 rounded transition-colors cursor-pointer text-slate-300 dark:text-slate-600 hover:text-rose-500"
                      >
                        <Trash2 size={11} />
                      </span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </section>

      {/* ═══════════════════ PARTE 2: ACTIVIDAD ═══════════════════ */}
      <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity size={16} className="text-purple-500 dark:text-purple-400" />
            <span>Actividad</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Últimos eventos de música, voz y soundboard.
          </p>
        </div>

        {/* Live Event Monitor */}
        <div className="grid grid-cols-1 gap-5">
          {/* Live Activity Feed / Monitor */}
          <div className="glass-panel p-4 border border-black/5 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1db954] animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Monitor de Actividad
                </h3>
              </div>
              <button
                onClick={clearLiveEvents}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {liveEvents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Esperando eventos de música, voz o soundboard...
                </p>
              ) : (
                liveEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {evt.title}
                      </span>
                      <span className="font-mono tabular-nums">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AddSoundModal isOpen={isAddSoundOpen} onClose={() => setIsAddSoundOpen(false)} />
      <EditSoundModal sound={editingSound} onClose={() => setEditingSound(null)} />
      <DeleteSoundModal sound={deletingSound} onClose={() => setDeletingSound(null)} />

      {/* Hidden file picker for attaching MP3 audio to existing sounds */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.ogg,.oga,.wav,.webm,.m4a,audio/*"
        className="hidden"
        onChange={handleAttachFile}
      />
    </div>
  );
}
