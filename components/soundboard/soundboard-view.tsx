"use client";

import { useState, useMemo, useRef } from "react";
import { useBot } from "@/context/bot-context";
import { SoundItem, SoundCategory } from "@/lib/mock-data";
import { AddSoundModal } from "@/components/soundboard/add-sound-modal";
import { AddPhraseModal } from "@/components/phrase-to-sound/add-phrase-modal";
import {
  Volume2,
  Play,
  Plus,
  Search,
  MessageSquare,
  Activity,
  Trash2,
  Zap,
  Radio,
  Upload,
} from "lucide-react";

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
    sounds,
    phraseTriggers,
    activeSoundId,
    playSound,
    attachSoundAudio,
    togglePhraseTrigger,
    deletePhraseTrigger,
    simulatePhraseDetection,
    liveEvents,
    clearLiveEvents,
  } = useBot();

  const [searchSound, setSearchSound] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | SoundCategory>("all");
  const [isAddSoundOpen, setIsAddSoundOpen] = useState(false);
  const [isAddPhraseOpen, setIsAddPhraseOpen] = useState(false);
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

  const filteredSounds = useMemo(() => {
    return sounds.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchSound.toLowerCase());
      const matchesCat = selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [sounds, searchSound, selectedCategory]);

  return (
    <div className="space-y-8 pb-28">
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

          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sonido..."
              value={searchSound}
              onChange={(e) => setSearchSound(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* MPC Audio Sampler Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredSounds.map((snd) => {
            const isPlayingThis = activeSoundId === snd.id;

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

                  {isPlayingThis && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1db954]" />
                    </span>
                  )}
                </div>

                <div className="w-full min-w-0">
                  <div className="font-medium text-xs text-slate-900 dark:text-white truncate" title={snd.name}>
                    {snd.name}
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
                      <span>{snd.playsCount} plays</span>
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
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════ PARTE 2: PHRASE TO SOUND ═══════════════════ */}
      <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-500 dark:text-purple-400" />
              <span>Phrase to Sound</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vincular palabras o frases para que el bot reproduzca un sonido automáticamente al detectarlas en Discord.
            </p>
          </div>

          <button
            onClick={() => setIsAddPhraseOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>Nueva frase</span>
          </button>
        </div>

        {/* Phrases List & Live Event Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Registered Triggers (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-2">
            {phraseTriggers.length === 0 ? (
              <div className="p-8 text-center glass-panel">
                <p className="text-xs text-slate-400">No hay frases registradas aún.</p>
              </div>
            ) : (
              phraseTriggers.map((trg) => (
                <div
                  key={trg.id}
                  className={`glass-panel p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    trg.enabled
                      ? "border-black/5 dark:border-white/5 hover:border-purple-500/20"
                      : "opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-base">
                      {trg.soundEmoji || "🔊"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                          &ldquo;{trg.phrase}&rdquo;
                        </span>
                        <span className="text-[#1ed760] text-xs">→</span>
                        <span className="text-xs font-medium text-slate-800 dark:text-white truncate">
                          {trg.soundName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 tabular-nums">
                        <span>{trg.exactMatch ? "Coincidencia exacta" : "Contiene palabra"}</span>
                        <span>&bull;</span>
                        <span className="text-slate-500 dark:text-slate-400">{trg.triggerCount} disparos</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Simulator */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    <button
                      onClick={() => simulatePhraseDetection(trg.id)}
                      disabled={!trg.enabled}
                      title="Simular detección en canal de Discord"
                      className="glass-btn px-2.5 py-1 text-[11px] text-[#1ed760] hover:bg-[#1db954]/10 border-[#1db954]/25 flex items-center gap-1 disabled:opacity-40"
                    >
                      <Zap size={12} className="fill-current" />
                      <span>Probar</span>
                    </button>

                    {/* Minimal Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={trg.enabled}
                      onClick={() => togglePhraseTrigger(trg.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        trg.enabled ? "bg-[#1db954]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          trg.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deletePhraseTrigger(trg.id)}
                      title="Eliminar disparador"
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Live Activity Feed / Monitor (Right col) */}
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
                  Esperando eventos de audio o palabras clave...
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
      <AddPhraseModal isOpen={isAddPhraseOpen} onClose={() => setIsAddPhraseOpen(false)} />

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
