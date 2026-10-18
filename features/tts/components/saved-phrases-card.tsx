"use client";

import type { VoiceItem, SavedPhrase } from "@/types/domain";
import { Bookmark, Plus, Play, Trash2, ArrowUpLeft, Radio, Loader2 } from "lucide-react";

export interface SavedPhrasesCardProps {
  phrases: SavedPhrase[];
  isLoading: boolean;
  voices: VoiceItem[];
  playingPhraseId: string | null;
  emittingPhraseId: string | null;
  isComposerBusy: boolean;
  onNewPhrase: () => void;
  onDeleteRequest: (phrase: SavedPhrase) => void;
  onLoadToComposer: (phrase: SavedPhrase) => void;
  onPreview: (phrase: SavedPhrase) => void;
  onEmit: (phrase: SavedPhrase) => void;
}

export function SavedPhrasesCard({
  phrases,
  isLoading,
  voices,
  playingPhraseId,
  emittingPhraseId,
  isComposerBusy,
  onNewPhrase,
  onDeleteRequest,
  onLoadToComposer,
  onPreview,
  onEmit,
}: SavedPhrasesCardProps) {
  return (
    <div className="glass-card p-4 border border-black/5 dark:border-white/10">
      <div className="flex items-center justify-between mb-3 border-b border-black/5 dark:border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <Bookmark size={15} className="text-purple-600 dark:text-purple-400" />
          <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
            Frases Guardadas
          </h4>
        </div>

        <button
          onClick={onNewPhrase}
          className="glass-pill px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 border border-purple-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <Plus size={12} />
          <span>Nueva frase</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin text-purple-500" />
          <span className="text-xs">Cargando frases de Supabase...</span>
        </div>
      ) : phrases.length === 0 ? (
        <div className="text-center py-8 px-2">
          <Bookmark size={28} className="mx-auto text-slate-400/50 mb-2" />
          <p className="text-xs text-slate-400">No tienes frases guardadas aún.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Crea una frase para reproducirla con un solo clic.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
          {phrases.map((phrase) => {
            const voiceInfo = voices.find((v) => v.id === phrase.voice);
            const isPlaying = playingPhraseId === phrase.id;
            const isEmitting = emittingPhraseId === phrase.id;
            const isPhraseBusy =
              isPlaying || isEmitting || isComposerBusy || !!playingPhraseId || !!emittingPhraseId;

            return (
              <div
                key={phrase.id}
                className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col gap-2 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {phrase.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                      &ldquo;{phrase.text}&rdquo;
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteRequest(phrase)}
                    disabled={isPhraseBusy}
                    title="Eliminar frase"
                    className={`p-1 transition-colors ${
                      isPhraseBusy
                        ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 pointer-events-none"
                        : "text-slate-400 hover:text-red-400 cursor-pointer"
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 text-[10px]">
                  {/* Voice Badge */}
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                    {voiceInfo ? `${voiceInfo.flag} ${voiceInfo.name}` : phrase.voice}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Copy/Load to composer */}
                    <button
                      onClick={() => onLoadToComposer(phrase)}
                      disabled={isPhraseBusy}
                      title="Cargar al editor"
                      className={`p-1 rounded transition-colors ${
                        isPhraseBusy
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 pointer-events-none"
                          : "text-slate-400 hover:text-white cursor-pointer"
                      }`}
                    >
                      <ArrowUpLeft size={13} />
                    </button>

                    {/* Preview Audio */}
                    <button
                      onClick={() => onPreview(phrase)}
                      disabled={isPhraseBusy}
                      title="Probar en navegador"
                      className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPlaying ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Play size={10} />
                      )}
                      <span>Probar</span>
                    </button>

                    {/* Speak in Discord */}
                    <button
                      onClick={() => onEmit(phrase)}
                      disabled={isPhraseBusy}
                      title="Emitir en Discord"
                      className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isEmitting ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Radio size={10} />
                      )}
                      <span>Emitir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
