"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Music,
  ListPlus,
  ArrowRightCircle,
  SkipForward,
  Pause,
  Play,
  Square,
  RotateCcw,
  Shuffle,
  Repeat,
  Volume2,
  ListMusic,
  Lock,
  Sparkles,
  Layers,
  X,
  Info,
  MessageSquareQuote,
  ChevronRight,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type VoiceBinding,
  type VoiceCommandId,
  VOICE_COMMANDS,
} from "../types/voice-types";

export interface VoiceBindingsCardProps {
  bindings: VoiceBinding[];
  onBindingsChange: (bindings: VoiceBinding[]) => void;
  wakeWord: string;
  /** TTS reply templates, so each command's reply sits next to its phrases. */
  templates: Record<string, string>;
  onTemplatesChange: (templates: Record<string, string>) => void;
  ttsEnabled: boolean;
  /** Save button inside the form: shown while there are unsaved changes. */
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

const COMMAND_ICONS: Record<VoiceCommandId, React.ReactNode> = {
  play: <Music size={16} className="text-purple-400" />,
  play_next: <ArrowRightCircle size={16} className="text-cyan-400" />,
  enqueue: <ListPlus size={16} className="text-blue-400" />,
  skip: <SkipForward size={16} className="text-amber-400" />,
  pause: <Pause size={16} className="text-slate-400" />,
  resume: <Play size={16} className="text-emerald-400" />,
  stop: <Square size={16} className="text-rose-400" />,
  previous: <RotateCcw size={16} className="text-indigo-400" />,
  shuffle: <Shuffle size={16} className="text-teal-400" />,
  autoplay_on: <Repeat size={16} className="text-green-400" />,
  autoplay_off: <Repeat size={16} className="text-slate-400" />,
  volume: <Volume2 size={16} className="text-orange-400" />,
  queue: <ListMusic size={16} className="text-violet-400" />,
  hola_que_hace: <Sparkles size={16} className="text-pink-400" />,
};

type CategoryId = "all" | "playback" | "control" | "queue";

interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: React.ReactNode;
  commandIds: VoiceCommandId[];
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "all",
    label: "Todos",
    icon: <Layers size={14} />,
    commandIds: ["play", "play_next", "enqueue", "pause", "resume", "skip", "previous", "stop", "queue", "shuffle", "autoplay_on", "autoplay_off", "volume", "hola_que_hace"],
  },
  { id: "playback", label: "Reproducir y Cola", icon: <Music size={14} />, commandIds: ["play", "play_next", "enqueue", "queue"] },
  { id: "control", label: "Control de Audio", icon: <Play size={14} />, commandIds: ["pause", "resume", "skip", "previous", "stop"] },
  { id: "queue", label: "Ajustes y Efectos", icon: <Shuffle size={14} />, commandIds: ["shuffle", "autoplay_on", "autoplay_off", "volume"] },
];

export function VoiceBindingsCard({
  bindings,
  onBindingsChange,
  wakeWord,
  templates,
  onTemplatesChange,
  ttsEnabled,
  onSave,
  isSaving,
  isDirty,
}: VoiceBindingsCardProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [selectedId, setSelectedId] = useState<VoiceCommandId>("play");

  // Group user bindings by commandId
  const customByCommand = useMemo(() => {
    const map = new Map<VoiceCommandId, string[]>();
    for (const cmd of VOICE_COMMANDS) map.set(cmd.id, []);
    for (const b of bindings) {
      const list = map.get(b.command_id) || [];
      if (!list.includes(b.phrase.toLowerCase())) list.push(b.phrase.toLowerCase());
      map.set(b.command_id, list);
    }
    return map;
  }, [bindings]);

  // Filter commands by category and search
  const filteredCommands = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    const allowedIds = new Set(cat?.commandIds ?? []);
    const q = searchQuery.toLowerCase();

    return VOICE_COMMANDS.filter((cmd) => {
      if (!allowedIds.has(cmd.id)) return false;
      if (!q) return true;
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.defaultPhrases.some((p) => p.includes(q)) ||
        (customByCommand.get(cmd.id) || []).some((p) => p.includes(q))
      );
    });
  }, [activeCategory, searchQuery, customByCommand]);

  // The effective selection: the chosen command if it is still in the filtered list,
  // otherwise the first filtered command. Derived in render to avoid a setState effect.
  const effectiveId: VoiceCommandId =
    filteredCommands.some((c) => c.id === selectedId)
      ? selectedId
      : filteredCommands[0]?.id ?? selectedId;

  const selected = VOICE_COMMANDS.find((c) => c.id === effectiveId) ?? VOICE_COMMANDS[0];
  const selectedCustom = customByCommand.get(selected.id) || [];

  const handleAddPhrase = () => {
    const raw = customInput.trim().toLowerCase();
    if (!raw) return;
    if (bindings.some((b) => b.phrase.toLowerCase() === raw)) {
      setCustomInput("");
      return;
    }
    onBindingsChange([{ phrase: raw, command_id: selected.id }, ...bindings]);
    setCustomInput("");
  };

  const handleRemovePhrase = (phrase: string) => {
    onBindingsChange(bindings.filter((b) => b.phrase.toLowerCase() !== phrase.toLowerCase()));
  };

  const currentTemplate = templates[selected.id] ?? selected.defaultTemplate;
  const templateIsCustom = currentTemplate !== selected.defaultTemplate;

  const handleTemplateChange = (value: string) => {
    onTemplatesChange({ ...templates, [selected.id]: value });
  };
  const handleResetTemplate = () => {
    onTemplatesChange({ ...templates, [selected.id]: selected.defaultTemplate });
  };

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              Diccionario de Comandos
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {VOICE_COMMANDS.length} comandos
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Elige un comando a la izquierda para ver y editar sus frases y su respuesta hablada.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-500/[0.08] dark:bg-purple-950/30 border border-purple-500/20 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 shrink-0">
          <Info size={15} className="shrink-0 text-purple-500" />
          <span>
            Palabra clave:{" "}
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 font-mono font-bold text-purple-800 dark:text-purple-200">
              {wakeWord || "bot"}
            </span>
          </span>
        </div>
      </div>

      {/* List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-4">
        {/* LEFT: search, categories and command list */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comando o frase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1" role="tablist" aria-label="Categorías de comandos">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div
            role="listbox"
            aria-label="Comandos de voz"
            className="rounded-2xl border border-black/5 dark:border-white/10 flex lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:max-h-[520px] lg:overflow-y-auto scrollbar-thin divide-x lg:divide-x-0 lg:divide-y divide-black/5 dark:divide-white/5"
          >
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Sin resultados para &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredCommands.map((cmd) => {
                const isActive = cmd.id === effectiveId;
                const count = (customByCommand.get(cmd.id) || []).length;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedId(cmd.id);
                      setCustomInput("");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors shrink-0 min-w-[180px] lg:min-w-0 cursor-pointer ${
                      isActive
                        ? "bg-purple-500/10 dark:bg-purple-500/15"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] shrink-0">
                      {COMMAND_ICONS[cmd.id]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {cmd.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {cmd.defaultPhrases.length} de fábrica
                        {count > 0 && ` · ${count} propia${count > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 transition-colors ${isActive ? "text-purple-500" : "text-slate-300 dark:text-slate-600"}`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: detail of the selected command */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 p-4 sm:p-5 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 shrink-0">
                {COMMAND_ICONS[selected.id]}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{selected.label}</h4>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">ID: /{selected.id}</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium shrink-0 border ${
                selected.requiresParam
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
              }`}
            >
              {selected.requiresParam ? "+ parámetro" : "sin parámetro"}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{selected.description}</p>

          {/* Default phrases */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              <Lock size={11} className="text-slate-400" />
              <span>Frases de fábrica:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.defaultPhrases.map((phrase) => (
                <span
                  key={phrase}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-black/[0.04] dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-black/5 dark:border-white/5"
                >
                  &ldquo;{phrase}&rdquo;
                </span>
              ))}
            </div>
          </div>

          {/* Custom phrases */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1.5">
              <Sparkles size={11} className="text-purple-500" />
              <span>Tus frases ({selectedCustom.length}):</span>
            </div>
            {selectedCustom.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Aún no añades frases propias.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedCustom.map((phrase) => (
                  <span
                    key={phrase}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30"
                  >
                    <span>&ldquo;{phrase}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhrase(phrase)}
                      className="text-purple-500 hover:text-rose-500 transition-colors cursor-pointer"
                      title={`Eliminar frase "${phrase}"`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick add */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Añadir frase para /${selected.id}...`}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPhrase();
                }
              }}
              className="glass-input flex-1 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <Button variant="solid" size="sm" onClick={handleAddPhrase} isDisabled={!customInput.trim()} className="h-8 px-3 text-xs">
              <Plus size={13} className="mr-1" />
              <span>Añadir</span>
            </Button>
          </div>

          {/* Example */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Ejemplo:</span>
            <span className="font-mono text-purple-600 dark:text-purple-300">
              &ldquo;{wakeWord || "bot"} {selected.defaultPhrases[0]}{" "}
              {selected.paramPlaceholder ? selected.paramPlaceholder.split(",")[0].replace("ej. ", "") : ""}&rdquo;
            </span>
          </div>

          {/* Spoken reply template for THIS command */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <MessageSquareQuote size={13} className="text-purple-500" />
                <span>Respuesta hablada</span>
                {!ttsEnabled && (
                  <span className="text-[10px] font-normal text-slate-400">(confirmación desactivada)</span>
                )}
              </div>
              {templateIsCustom && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetTemplate}
                  title="Restaurar respuesta predeterminada"
                  className="h-6 w-6 text-slate-400 hover:text-purple-500"
                >
                  <RotateCcw size={11} />
                </Button>
              )}
            </div>
            <input
              type="text"
              value={currentTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder={selected.defaultTemplate}
              disabled={!ttsEnabled}
              className="glass-input w-full px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {selected.requiresParam
                ? `Usa {query} para incluir lo que dijiste. Por defecto: "${selected.defaultTemplate}"`
                : `Por defecto: "${selected.defaultTemplate}"`}
            </p>
          </div>

          {/* In-form save: appears while there are unsaved changes (phrases or reply) */}
          {isDirty && (
            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-500 font-medium">Cambios sin guardar</span>
              <Button variant="solid" size="sm" onClick={onSave} isLoading={isSaving} isDisabled={isSaving} className="px-4">
                <Save size={14} />
                <span>Guardar</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
