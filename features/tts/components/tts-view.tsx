"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTTS } from "@/context/tts-context";
import { soundApi } from "@/lib/sound-api";
import type { SavedPhrase } from "@/types/domain";
import { fetchSavedPhrases, deleteSavedPhrase } from "@/lib/phrases-service";
import { AddPhraseModal } from "./add-phrase-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TTSComposerCard } from "./tts-composer-card";
import { RecentTTSCard } from "./recent-tts-card";
import { SavedPhrasesCard } from "./saved-phrases-card";
import { useVoices } from "@/hooks/use-voices";
import { useToast } from "@/components/ui/toast";
import { Trash2, Mic, AlertTriangle } from "lucide-react";

export function TTSView() {
  const { user } = useAuth();
  const { recentTTS, sendTTS } = useTTS();
  const { toast } = useToast();
  const voices = useVoices();

  // Composer State
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("loquendo");
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Saved Phrases State (Supabase)
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playingPhraseId, setPlayingPhraseId] = useState<string | null>(null);
  const [emittingPhraseId, setEmittingPhraseId] = useState<string | null>(null);
  const [phraseToDelete, setPhraseToDelete] = useState<SavedPhrase | null>(null);

  // Load Saved Phrases from Supabase
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingPhrases(true);
      try {
        const data = await fetchSavedPhrases(user?.id);
        if (mounted) setSavedPhrases(data);
      } finally {
        if (mounted) setIsLoadingPhrases(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Handle Main Composer Send to Discord
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);

    const res = await sendTTS(text.trim(), selectedVoiceId, pitch, rate);

    if (res.success) {
      toast("Mensaje emitido en Discord con éxito.", "emit");
      setText("");
    } else {
      toast(res.error || "Error al emitir en Discord.", "error");
    }

    setIsSending(false);
  };

  // Handle Browser Audio Preview
  const handlePreview = async () => {
    if (!text.trim() || isPreviewing) return;
    setIsPreviewing(true);
    try {
      await soundApi.previewTTS({
        text: text.trim(),
        voice: selectedVoiceId,
        pitch,
        rate,
      });
    } catch {
      toast("No se pudo reproducir la vista previa.", "error");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Preview a saved phrase in browser
  const handlePreviewPhrase = async (phrase: SavedPhrase) => {
    setPlayingPhraseId(phrase.id);
    try {
      await soundApi.previewTTS({
        text: phrase.text,
        voice: phrase.voice,
        pitch: phrase.pitch,
        rate: phrase.rate,
      });
    } catch {
      toast("Error al reproducir vista previa de la frase.", "error");
    } finally {
      setPlayingPhraseId(null);
    }
  };

  // Speak a saved phrase directly to Discord
  const handleSpeakPhrase = async (phrase: SavedPhrase) => {
    setEmittingPhraseId(phrase.id);
    const res = await sendTTS(phrase.text, phrase.voice, phrase.pitch, phrase.rate);
    setEmittingPhraseId(null);

    if (res.success) {
      toast(`"${phrase.title}" emitida en Discord.`, "emit");
    } else {
      toast(res.error || "Error al emitir frase.", "error");
    }
  };

  // Load saved phrase into the composer
  const handleLoadToComposer = (phrase: SavedPhrase) => {
    setText(phrase.text);
    if (phrase.voice) setSelectedVoiceId(phrase.voice);
    if (phrase.pitch) setPitch(phrase.pitch);
    if (phrase.rate) setRate(phrase.rate);
    toast(`Frase cargada al editor.`, "info");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ─── Main TTS Composer (Left 2 columns) ────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <TTSComposerCard
          text={text}
          onTextChange={setText}
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          onVoiceChange={setSelectedVoiceId}
          pitch={pitch}
          onPitchChange={setPitch}
          rate={rate}
          onRateChange={setRate}
          isSending={isSending}
          isPreviewing={isPreviewing}
          isPhraseBusy={!!emittingPhraseId}
          onPreview={handlePreview}
          onSend={() => handleSend()}
        />
      </div>

      {/* ─── Frases Guardadas (Right column - Supabase) ────────── */}
      <div className="space-y-3">
        <RecentTTSCard messages={recentTTS} />
        <SavedPhrasesCard
          phrases={savedPhrases}
          isLoading={isLoadingPhrases}
          voices={voices}
          playingPhraseId={playingPhraseId}
          emittingPhraseId={emittingPhraseId}
          isComposerBusy={isSending}
          onNewPhrase={() => setIsAddModalOpen(true)}
          onDeleteRequest={setPhraseToDelete}
          onLoadToComposer={handleLoadToComposer}
          onPreview={handlePreviewPhrase}
          onEmit={handleSpeakPhrase}
        />
      </div>

      {/* Modal para Crear Nueva Frase */}
      <AddPhraseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        voices={voices}
        userId={user?.id}
        onPhraseAdded={(newPhrase) => {
          setSavedPhrases((prev) => [newPhrase, ...prev]);
          toast(`Frase "${newPhrase.title}" guardada exitosamente.`, "success");
        }}
      />

      {/* Modal para Confirmar Eliminación de Frase */}
      <ConfirmDialog
        isOpen={!!phraseToDelete}
        onClose={() => setPhraseToDelete(null)}
        onConfirm={async () => {
          if (!phraseToDelete) return;
          const id = phraseToDelete.id;
          setPhraseToDelete(null);
          try {
            await deleteSavedPhrase(id);
            setSavedPhrases((prev) => prev.filter((p) => p.id !== id));
            toast("Frase eliminada.", "info");
          } catch {
            toast("No se pudo eliminar la frase guardada.", "error");
          }
        }}
        maxWidth="md"
        icon={<Trash2 size={20} className="text-rose-500" />}
        title="Eliminar frase guardada"
        subtitle={phraseToDelete ? `¿Seguro que deseas eliminar «${phraseToDelete.title}»?` : undefined}
        confirmText="Eliminar definitivamente"
        confirmVariant="danger"
        confirmIcon={<Trash2 size={14} />}
      >
        {phraseToDelete && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Mic size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                  {phraseToDelete.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-3 leading-relaxed">
                  &ldquo;{phraseToDelete.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                    {voices.find((v) => v.id === phraseToDelete.voice)?.name || phraseToDelete.voice}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Esta frase se eliminará de forma permanente de tu biblioteca personal.
              </p>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
