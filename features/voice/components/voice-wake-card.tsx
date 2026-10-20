"use client";

import { Sparkles, Radio, HelpCircle } from "lucide-react";
import { GlassSelect } from "@/components/ui/glass-select";

export interface VoiceWakeCardProps {
  wakeWord: string;
  onWakeWordChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español (es)", flag: "🇪🇸" },
  { value: "en", label: "English (en)", flag: "🇺🇸" },
];

export function VoiceWakeCard({
  wakeWord,
  onWakeWordChange,
  language,
  onLanguageChange,
  enabled,
  onEnabledChange,
}: VoiceWakeCardProps) {
  const currentWake = wakeWord.trim() || "ignite";

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Radio size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Activación por Voz
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles size={10} /> Groq Whisper AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personaliza el nombre con el que llamas al bot y el idioma del reconocimiento.
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none self-start sm:self-center">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {enabled ? "Módulo Activado" : "Módulo Pausado"}
          </span>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wake Word Input */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Palabra de Activación (Wake Word)</span>
            <span
              title="Palabra o nombre con el que iniciarás todas tus órdenes por voz."
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
            >
              <HelpCircle size={13} />
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={wakeWord}
              onChange={(e) => onWakeWordChange(e.target.value.toLowerCase())}
              placeholder="ej. ignite, bot, jarvis, oye"
              className="glass-input w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
            />
            <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 font-mono">
              prefijo obligatorio
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            El bot sólo responderá cuando tu frase comience por esta palabra.
          </p>
        </div>

        {/* Language Selector */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
            Idioma del Modelo de Voz
          </label>
          <GlassSelect
            value={language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
            size="md"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Optimiza el prompt inicial de Whisper para mayor precisión en este idioma.
          </p>
        </div>
      </div>

      {/* Live Syntax Preview */}
      <div className="p-3.5 rounded-xl bg-purple-600/[0.04] dark:bg-purple-500/[0.05] border border-purple-500/15">
        <div className="flex items-center justify-between text-xs font-medium text-purple-700 dark:text-purple-300 mb-1.5">
          <span>Estructura de detección en vivo:</span>
          <span className="font-mono text-[11px] bg-purple-500/10 px-2 py-0.5 rounded-md">
            &lt;wake_word&gt; + &lt;frase&gt; + [parámetro]
          </span>
        </div>
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <p className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✔</span>
            <span>
              &ldquo;<strong className="text-purple-600 dark:text-purple-400">{currentWake}</strong> reproduce una noche en medellin&rdquo;
              <span className="text-slate-400 dark:text-slate-500 ml-2">➔ Reproducir &apos;una noche en medellin&apos;</span>
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✔</span>
            <span>
              &ldquo;<strong className="text-purple-600 dark:text-purple-400">{currentWake}</strong> salta&rdquo;
              <span className="text-slate-400 dark:text-slate-500 ml-2">➔ Pasa a la siguiente canción</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
