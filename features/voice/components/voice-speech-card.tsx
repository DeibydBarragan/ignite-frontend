"use client";

import { useState } from "react";
import { Volume2, Square, Languages, Sparkles } from "lucide-react";
import { GlassSelect } from "@/components/ui/glass-select";
import { Button } from "@/components/ui/button";
import { FALLBACK_VOICES } from "@/lib/sound-fallbacks";
import { soundApi } from "@/features/soundboard/services/sound-api";

export interface VoiceSpeechCardProps {
  language: string;
  onLanguageChange: (value: string) => void;
  ttsVoice: string;
  onTtsVoiceChange: (voice: string) => void;
  ttsPitch?: number;
  onTtsPitchChange?: (pitch: number) => void;
  ttsRate?: number;
  onTtsRateChange?: (rate: number) => void;
  ttsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español (es) 🇪🇸" },
  { value: "en", label: "English (en) 🇺🇸" },
];

/**
 * Recognition language + confirmation voice (TTS voice, pitch, rate) + the TTS master switch.
 * The per-command reply templates live on the Comandos tab, next to each command.
 */
export function VoiceSpeechCard({
  language,
  onLanguageChange,
  ttsVoice,
  onTtsVoiceChange,
  ttsPitch = 1.0,
  onTtsPitchChange,
  ttsRate = 1.0,
  onTtsRateChange,
  ttsEnabled,
  onTtsEnabledChange,
}: VoiceSpeechCardProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handlePreviewVoice = async () => {
    if (isPlayingPreview) {
      soundApi.stopAudio();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    try {
      await soundApi.previewTTS({
        text: "Confirmación de voz activada. Reproduciendo música en el canal.",
        voice: ttsVoice || "es-MX-DaliaNeural",
        rate: ttsRate,
        pitch: ttsPitch,
      });
    } catch {
      // Audio playback failed or aborted
    } finally {
      setIsPlayingPreview(false);
    }
  };

  const voiceOptions = FALLBACK_VOICES.map((v) => ({
    value: v.id,
    label: `${v.flag} ${v.name} (${v.gender})`,
  }));

  const activeVoiceInfo =
    FALLBACK_VOICES.find((v) => v.id === ttsVoice) || FALLBACK_VOICES[2];

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-5">
      {/* Header with the confirmation (TTS) master switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Volume2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Confirmación Hablada (TTS)
              </h3>
              {activeVoiceInfo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={10} /> {activeVoiceInfo.flag} {activeVoiceInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El bot responderá hablando en el canal con el mensaje configurado al ejecutar cada orden.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none self-start sm:self-center">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {ttsEnabled ? "Confirmación Activa" : "Silencioso"}
          </span>
          <span className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => onTtsEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <span className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
          </span>
        </label>
      </div>

      {/* Language + confirmation voice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selector */}
        <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-purple-500" />
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Idioma de Reconocimiento (Whisper AI)
          </label>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Optimiza el modelo Whisper de Groq para reconocer términos y acentos con alta precisión.
        </p>
        <div className="pt-1">
          <GlassSelect
            value={language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
            size="md"
          />
        </div>
      </div>

      {/* Confirmation Voice (TTS) Selector */}
      <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-purple-500" />
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Voz de la Confirmación (TTS)
            </label>
          </div>

          {/* Test Voice Sample Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewVoice}
            title="Escuchar una muestra de esta voz"
            className="h-7 px-2.5 text-[11px] gap-1.5 rounded-lg border-purple-500/25 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
          >
            {isPlayingPreview ? (
              <>
                <Square size={11} className="fill-current text-rose-500" />
                <span>Detener</span>
              </>
            ) : (
              <>
                <Volume2 size={12} />
                <span>Probar voz</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Voz con la que el bot confirmará en el canal de voz cuando ejecutes una orden.
        </p>

        <div className="pt-1">
          <GlassSelect
            value={ttsVoice || "es-MX-DaliaNeural"}
            onChange={onTtsVoiceChange}
            options={voiceOptions}
            size="md"
          />
        </div>

        {/* Pitch & Rate Sliders */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Tono
              </label>
              <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
                {ttsPitch.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={ttsPitch}
              onChange={(e) => onTtsPitchChange?.(Number(e.target.value))}
              className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Velocidad
              </label>
              <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
                {ttsRate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={ttsRate}
              onChange={(e) => onTtsRateChange?.(Number(e.target.value))}
              className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>

        {activeVoiceInfo && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
            {activeVoiceInfo.description}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
