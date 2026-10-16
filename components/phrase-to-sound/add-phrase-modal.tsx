"use client";

import { useState, useMemo } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { GlassSelect } from "@/components/glass-select";
import { Button } from "@heroui/react";
import { Plus, MessageSquare, Sparkles } from "lucide-react";

export function AddPhraseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { sounds, addPhraseTrigger } = useBot();

  const [phrase, setPhrase] = useState("");
  const [selectedSoundId, setSelectedSoundId] = useState(sounds[0]?.id || "");
  const [exactMatch, setExactMatch] = useState(false);
  const [channelTarget, setChannelTarget] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim() || !selectedSoundId) return;

    addPhraseTrigger({
      phrase: phrase.trim(),
      soundId: selectedSoundId,
      exactMatch,
      channelTarget,
    });

    setPhrase("");
    onClose();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={<MessageSquare size={20} />}
      title="Nuevo Disparador: Frase a Sonido"
      subtitle="El bot reproducirá el sonido cuando reconozca esta frase en Discord"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            className="text-slate-600 dark:text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="add-phrase-form"
            size="sm"
            className="bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span>Crear disparador</span>
          </Button>
        </div>
      }
    >
      <form id="add-phrase-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Palabra o Frase Clave
          </label>
          <input
            type="text"
            required
            placeholder="Ej. GG, Victoria, F, Bruh, Hola bot..."
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            El bot analizará los mensajes o voz de Discord para detectar esta frase.
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Sonido a Reproducir (Desde la Base de Sonidos)
          </label>
          <GlassSelect
            value={selectedSoundId}
            onChange={setSelectedSoundId}
            options={sounds.map((snd) => ({
              value: snd.id,
              label: snd.name,
              icon: snd.emoji ? <span className="text-sm mr-1">{snd.emoji}</span> : undefined,
              subtitle: snd.category,
            }))}
            size="md"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={exactMatch}
              onChange={(e) => setExactMatch(e.target.checked)}
              className="rounded accent-[#1db954] w-4 h-4 cursor-pointer"
            />
            <span>
              <strong>Coincidencia Exacta</strong> (Solo si el mensaje contiene únicamente esta palabra)
            </span>
          </label>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">
              Ámbito de Detección
            </label>
            <GlassSelect
              value={channelTarget}
              onChange={setChannelTarget}
              options={[
                { value: "all", label: "Todos los canales del servidor" },
                { value: "voice_only", label: "Solo en canales de voz" },
                { value: "text_only", label: "Solo en canales de texto" },
              ]}
              size="sm"
            />
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
