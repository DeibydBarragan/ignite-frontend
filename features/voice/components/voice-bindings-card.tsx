"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Sliders, Music, SkipForward, Pause, Play, Square, RotateCcw, Shuffle, Volume2, ListMusic } from "lucide-react";
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
}

const COMMAND_ICONS: Record<VoiceCommandId, React.ReactNode> = {
  play: <Music size={14} className="text-purple-500" />,
  enqueue: <Plus size={14} className="text-blue-500" />,
  skip: <SkipForward size={14} className="text-amber-500" />,
  pause: <Pause size={14} className="text-slate-400" />,
  resume: <Play size={14} className="text-emerald-500" />,
  stop: <Square size={14} className="text-rose-500" />,
  previous: <RotateCcw size={14} className="text-indigo-500" />,
  shuffle: <Shuffle size={14} className="text-cyan-500" />,
  volume: <Volume2 size={14} className="text-orange-500" />,
  queue: <ListMusic size={14} className="text-teal-500" />,
};

export function VoiceBindingsCard({
  bindings,
  onBindingsChange,
  wakeWord,
}: VoiceBindingsCardProps) {
  const [newPhrase, setNewPhrase] = useState("");
  const [newCommandId, setNewCommandId] = useState<VoiceCommandId>("play");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCommand, setFilterCommand] = useState<string>("all");

  const cmdMap = useMemo(() => {
    return new Map(VOICE_COMMANDS.map((c) => [c.id, c]));
  }, []);

  const filteredBindings = useMemo(() => {
    return bindings.filter((b) => {
      const matchSearch =
        !searchQuery ||
        b.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.command_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCmd = filterCommand === "all" || b.command_id === filterCommand;
      return matchSearch && matchCmd;
    });
  }, [bindings, searchQuery, filterCommand]);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhrase = newPhrase.trim().toLowerCase();
    if (!cleanPhrase) return;

    // Evitar duplicados exactos
    if (bindings.some((b) => b.phrase.toLowerCase() === cleanPhrase)) {
      return;
    }

    onBindingsChange([
      { phrase: cleanPhrase, command_id: newCommandId },
      ...bindings,
    ]);
    setNewPhrase("");
  };

  const handleRemove = (phraseToRemove: string) => {
    onBindingsChange(
      bindings.filter((b) => b.phrase.toLowerCase() !== phraseToRemove.toLowerCase())
    );
  };

  const handleCommandChange = (phrase: string, command_id: VoiceCommandId) => {
    onBindingsChange(
      bindings.map((b) =>
        b.phrase.toLowerCase() === phrase.toLowerCase() ? { ...b, command_id } : b
      )
    );
  };

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              Diccionario de Comandos y Frases Clave
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
              {bindings.length} frases
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define qué palabras debes decir después de &ldquo;<strong>{wakeWord || "ignite"}</strong>&rdquo; para accionar cada comando.
          </p>
        </div>
      </div>

      {/* Add New Phrase Form */}
      <form
        onSubmit={handleAdd}
        className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center gap-3"
      >
        <div className="flex-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Frase a pronunciar
          </label>
          <input
            type="text"
            placeholder="ej. reproduce, toca, pon, agrega, siguiente..."
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="w-full md:w-64">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Comando a ejecutar
          </label>
          <select
            value={newCommandId}
            onChange={(e) => setNewCommandId(e.target.value as VoiceCommandId)}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white bg-transparent"
          >
            {VOICE_COMMANDS.map((cmd) => (
              <option
                key={cmd.id}
                value={cmd.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {cmd.label} ({cmd.id})
              </option>
            ))}
          </select>
        </div>

        <div className="self-end md:self-auto pt-1 md:pt-4">
          <Button
            variant="solid"
            size="sm"
            type="submit"
            isDisabled={!newPhrase.trim()}
            className="w-full md:w-auto h-9 px-4"
          >
            <Plus size={14} />
            <span>Añadir Frase</span>
          </Button>
        </div>
      </form>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar frase o comando..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Filtrar:</span>
          <select
            value={filterCommand}
            onChange={(e) => setFilterCommand(e.target.value)}
            className="glass-input px-2.5 py-1 text-xs text-slate-900 dark:text-white bg-transparent"
          >
            <option value="all" className="bg-white dark:bg-slate-900">Todos los comandos</option>
            {VOICE_COMMANDS.map((cmd) => (
              <option
                key={cmd.id}
                value={cmd.id}
                className="bg-white dark:bg-slate-900"
              >
                {cmd.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bindings List */}
      <div className="rounded-xl border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5 max-h-[420px] overflow-y-auto">
        {filteredBindings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No se encontraron frases configuradas con los filtros actuales.
          </div>
        ) : (
          filteredBindings.map((binding) => {
            const cmd = cmdMap.get(binding.command_id);
            const icon = COMMAND_ICONS[binding.command_id] || <Sliders size={14} />;
            return (
              <div
                key={binding.phrase}
                className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Phrase pill */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white truncate">
                    &ldquo;{binding.phrase}&rdquo;
                  </span>
                  <span className="text-slate-400 text-xs">➔</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {icon}
                    <span>{cmd?.label || binding.command_id}</span>
                  </div>
                </div>

                {/* Parameters Badge and Command Selector */}
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  {cmd?.requiresParam ? (
                    <span
                      title={cmd.paramPlaceholder}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 truncate max-w-[170px]"
                    >
                      +{cmd.paramPlaceholder ? cmd.paramPlaceholder.split(",")[0] : "parámetro"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-400 bg-black/5 dark:bg-white/5">
                      sin parámetros
                    </span>
                  )}

                  <select
                    value={binding.command_id}
                    onChange={(e) =>
                      handleCommandChange(binding.phrase, e.target.value as VoiceCommandId)
                    }
                    className="glass-input px-2 py-1 text-xs text-slate-700 dark:text-slate-300 bg-transparent"
                  >
                    {VOICE_COMMANDS.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-white dark:bg-slate-900"
                      >
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(binding.phrase)}
                    title={`Eliminar frase "${binding.phrase}"`}
                    className="text-slate-400 hover:text-rose-500 h-7 w-7"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
