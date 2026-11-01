"use client";

import { useState } from "react";
import {
  Radio,
  Sparkles,
  Lock,
  Plus,
  X,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VoiceWakeCardProps {
  wakeWord: string;
  onWakeWordChange: (value: string) => void;
}

const DEFAULT_WAKE_WORDS = ["bot", "ignite"];

export function VoiceWakeCard({
  wakeWord,
  onWakeWordChange,
}: VoiceWakeCardProps) {
  const [newWakeInput, setNewWakeInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Parse all configured wake words
  const rawWords = (wakeWord || "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

  // Custom words: any configured word that is not in the built-in defaults
  const customWakeWords = rawWords.filter(
    (w) => !DEFAULT_WAKE_WORDS.includes(w)
  );

  const handleAddWakeWord = () => {
    const cleaned = newWakeInput.trim().toLowerCase();
    setInputError(null);

    if (!cleaned) return;

    if (cleaned.length < 2) {
      setInputError("La palabra debe tener al menos 2 caracteres.");
      return;
    }

    if (DEFAULT_WAKE_WORDS.includes(cleaned)) {
      setInputError(`"${cleaned}" ya es una palabra de activación predeterminada.`);
      return;
    }

    if (customWakeWords.includes(cleaned)) {
      setInputError(`"${cleaned}" ya está en tu lista de palabras de activación.`);
      return;
    }

    const updatedCustom = [...customWakeWords, cleaned];
    onWakeWordChange([...DEFAULT_WAKE_WORDS, ...updatedCustom].join(", "));
    setNewWakeInput("");
  };

  const handleRemoveWakeWord = (wordToRemove: string) => {
    const updatedCustom = customWakeWords.filter((w) => w !== wordToRemove);
    onWakeWordChange([...DEFAULT_WAKE_WORDS, ...updatedCustom].join(", "));
  };

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Radio size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              Activación por Voz
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles size={10} /> Groq Whisper
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configura las palabras con las que despiertas al bot antes de darle una orden.
          </p>
        </div>
      </div>

      {/* SECTION 1: Wake Words Card (Styled like command cards) */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white mb-1">
            <span>Palabras de Activación (Wake Words)</span>
            <span
              title="Cualquiera de estas palabras despertará al bot en el canal antes de ejecutar lo que digas."
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
            >
              <HelpCircle size={14} />
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El bot procesará y ejecutará tu comando cuando tu frase empiece por alguna de estas palabras.
          </p>
        </div>

        {/* Wake Words Pills Group */}
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Palabras Activas ({DEFAULT_WAKE_WORDS.length + customWakeWords.length})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* System Default Wake Words */}
            {DEFAULT_WAKE_WORDS.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 shadow-2xs"
                title="Palabra de activación predeterminada del sistema (siempre activa)"
              >
                <Lock size={12} className="text-purple-500 shrink-0" />
                <span>&ldquo;{word}&rdquo;</span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Predeterminado
                </span>
              </span>
            ))}

            {/* Custom User Wake Words */}
            {customWakeWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-2xs group"
              >
                <Sparkles size={12} className="text-emerald-500 shrink-0" />
                <span>&ldquo;{word}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWakeWord(word)}
                  title={`Eliminar "${word}"`}
                  className="ml-0.5 p-0.5 rounded-md hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Add Custom Wake Word Input */}
          <div className="pt-2">
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={newWakeInput}
                onChange={(e) => {
                  setNewWakeInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddWakeWord();
                  }
                }}
                placeholder="Añadir palabra personalizada (ej. jarvis, oye, asistente)"
                className="glass-input flex-1 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium rounded-xl"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddWakeWord}
                disabled={!newWakeInput.trim()}
                className="shrink-0 text-xs px-3 py-2 rounded-xl"
              >
                <Plus size={14} />
                <span>Añadir</span>
              </Button>
            </div>
            {inputError && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {inputError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
