"use client";

import { useMemo } from "react";
import type { VoiceItem } from "@/types/domain";
import { GlassSelect } from "@/components/ui/glass-select";
import { Mic, Send, Volume2, Loader2, Undo2, Redo2, X } from "lucide-react";

export interface TTSComposerCardProps {
  text: string;
  onTextChange: (value: string) => void;
  voices: VoiceItem[];
  selectedVoiceId: string;
  onVoiceChange: (value: string) => void;
  pitch: number;
  onPitchChange: (value: number) => void;
  rate: number;
  onRateChange: (value: number) => void;
  isSending: boolean;
  isPreviewing: boolean;
  isPhraseBusy: boolean;
  onPreview: () => void;
  onSend: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function TTSComposerCard({
  text,
  onTextChange,
  voices,
  selectedVoiceId,
  onVoiceChange,
  pitch,
  onPitchChange,
  rate,
  onRateChange,
  isSending,
  isPreviewing,
  isPhraseBusy,
  onPreview,
  onSend,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onKeyDown,
}: TTSComposerCardProps) {
  const maxChars = 300;
  const charsLeft = maxChars - text.length;

  const voiceOptions = useMemo(() => {
    return voices.map((v) => ({
      value: v.id,
      label: v.name,
      flag: v.flag,
      subtitle: v.gender,
    }));
  }, [voices]);

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10">
      <div className="flex items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Mic size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Sintetizador de Voz (TTS)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Voces neuronales de Microsoft y Loquendo conectadas en vivo con tu bot.
            </p>
          </div>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative mb-3">
        <textarea
          rows={4}
          maxLength={maxChars}
          placeholder="Escribe el mensaje que dirá el bot en Discord..."
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="glass-input w-full p-3.5 pb-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
        />

        {/* Barra inferior del textarea: Botones de historial (Deshacer/Rehacer/Limpiar) y contador */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Volver al texto anterior (Ctrl+Z)"
              aria-label="Volver al texto anterior"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Undo2 size={12} />
              <span>Anterior</span>
            </button>
          )}

          {onRedo && canRedo && (
            <button
              type="button"
              onClick={onRedo}
              title="Rehacer texto (Ctrl+Y o Ctrl+Shift+Z)"
              aria-label="Rehacer texto"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Redo2 size={12} />
              <span className="hidden sm:inline">Rehacer</span>
            </button>
          )}

          {text.length > 0 && (
            <button
              type="button"
              onClick={() => onTextChange("")}
              title="Limpiar texto"
              aria-label="Limpiar texto"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <span
          className={`absolute bottom-2.5 right-3 text-[10px] font-mono tabular-nums ${
            charsLeft < 30 ? "text-amber-500" : "text-slate-400"
          }`}
        >
          {charsLeft} caracteres restantes
        </span>
      </div>

      {/* Voice Selector & Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 mb-4">
        {/* Voice Dropdown */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Voz seleccionada
          </label>
          <GlassSelect
            value={selectedVoiceId}
            onChange={onVoiceChange}
            options={voiceOptions}
            size="sm"
          />
        </div>

        {/* Pitch Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tono
            </label>
            <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
              {pitch.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={pitch}
            onChange={(e) => onPitchChange(Number(e.target.value))}
            className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* Rate / Speed Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Velocidad
            </label>
            <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
              {rate.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={rate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onPreview}
          disabled={!text.trim() || isPreviewing || isSending || isPhraseBusy}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPreviewing ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
          <span>Probar en navegador</span>
        </button>

        <button
          onClick={onSend}
          disabled={!text.trim() || isSending || isPhraseBusy || isPreviewing}
          className={`px-4 py-2 rounded-xl font-medium text-xs shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            isSending
              ? "bg-[#1db954] text-black"
              : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isSending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Emitiendo</span>
            </>
          ) : (
            <>
              <Send size={13} />
              <span>Emitir en Discord</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
