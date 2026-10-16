"use client";

import { useState } from "react";
import { GlassModal } from "@/components/glass-modal";
import { SavedPhrase, deleteSavedPhrase } from "@/lib/phrases-service";
import { VoiceItem } from "@/lib/sound-api";
import { Button } from "@heroui/react";
import { Trash2, AlertTriangle, Mic, Loader2 } from "lucide-react";

export function DeletePhraseModal({
  phrase,
  voices = [],
  onClose,
  onDeleted,
}: {
  phrase: SavedPhrase | null;
  voices?: VoiceItem[];
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!phrase) return null;

  const voiceInfo = voices.find((v) => v.id === phrase.voice);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteSavedPhrase(phrase.id);
      setIsDeleting(false);
      onDeleted(phrase.id);
      onClose();
    } catch {
      setError("No se pudo eliminar la frase guardada. Inténtalo de nuevo.");
      setIsDeleting(false);
    }
  };

  return (
    <GlassModal
      isOpen={!!phrase}
      onClose={onClose}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Eliminar frase guardada"
      subtitle={`¿Seguro que deseas eliminar «${phrase.title}»?`}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isDeleting}
            className="text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            isDisabled={isDeleting}
            onPress={handleDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isDeleting ? "Eliminando" : "Eliminar definitivamente"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Phrase Info Preview */}
        <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <Mic size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {phrase.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-3 leading-relaxed">
              &ldquo;{phrase.text}&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                {voiceInfo ? `${voiceInfo.flag} ${voiceInfo.name}` : phrase.voice}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta frase se eliminará de forma permanente de tu biblioteca personal. No podrás volver a emitirla con un clic ni recuperar sus ajustes de voz.
          </p>
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </GlassModal>
  );
}
