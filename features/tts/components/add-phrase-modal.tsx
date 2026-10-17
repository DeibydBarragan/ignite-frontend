"use client";

import { useState, useMemo } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { soundApi } from "@/lib/sound-api";
import type { VoiceItem, SavedPhrase } from "@/types/domain";
import { createSavedPhrase } from "@/lib/phrases-service";
import { GlassSelect } from "@/components/ui/glass-select";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { BookmarkPlus, Volume2, Loader2, Sparkles } from "lucide-react";

export function AddPhraseModal({
  isOpen,
  onClose,
  voices,
  userId,
  onPhraseAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceItem[];
  userId?: string;
  onPhraseAdded: (phrase: SavedPhrase) => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("loquendo");
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const voiceOptions = useMemo(() => {
    return voices.map((v) => ({
      value: v.id,
      label: v.name,
      flag: v.flag,
      subtitle: v.gender,
    }));
  }, [voices]);

  const handlePreview = async () => {
    if (!text.trim() || isPreviewing) return;
    setIsPreviewing(true);
    try {
      await soundApi.previewTTS({
        text,
        voice: selectedVoice,
        pitch,
        rate,
      });
    } catch (err) {
      logger.error(err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await createSavedPhrase({
        title: title.trim(),
        text: text.trim(),
        voice: selectedVoice,
        pitch,
        rate,
        userId,
      });

      onPhraseAdded(created);
      setTitle("");
      setText("");
      onClose();
    } catch (err) {
      logger.error("Error guardando frase:", err);
      setSaveError("No se pudo guardar en Supabase. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={<BookmarkPlus size={20} className="text-purple-400" />}
      title="Guardar Nueva Frase TTS"
      subtitle="Crea una frase personalizada con tu voz favorita para emitir cuando quieras"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={handlePreview}
            isDisabled={!text.trim() || isPreviewing}
            className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5"
          >
            {isPreviewing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Volume2 size={13} />
            )}
            <span>Probar en navegador</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              className="text-slate-600 dark:text-slate-300 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="add-phrase-form"
              size="sm"
              isDisabled={!title.trim() || !text.trim() || isSaving}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>Guardar Frase</span>
            </Button>
          </div>
        </div>
      }
    >
      <form id="add-phrase-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Título / Nombre de la Frase
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Saludo de bienvenida, Entrada Épica, Victoria..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Message Text */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Texto a sintetizar
          </label>
          <textarea
            required
            rows={3}
            maxLength={300}
            placeholder="Escribe lo que dirá el bot..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="glass-input w-full p-3 text-xs text-slate-900 dark:text-white resize-none"
          />
          <div className="flex justify-end text-[10px] text-slate-400 mt-1">
            {300 - text.length} caracteres disponibles
          </div>
        </div>

        {/* Voice Select */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Voz del Sintetizador
          </label>
          <GlassSelect
            value={selectedVoice}
            onChange={setSelectedVoice}
            options={voiceOptions}
            size="md"
          />
        </div>

        {saveError && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}

        {/* Pitch & Rate */}
        <div className="grid grid-cols-2 gap-3.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-400">Tono</label>
              <span className="text-[11px] font-mono text-purple-400">{pitch.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-400">Velocidad</label>
              <span className="text-[11px] font-mono text-purple-400">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
