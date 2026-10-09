"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
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
          <select
            value={selectedSoundId}
            onChange={(e) => setSelectedSoundId(e.target.value)}
            className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          >
            {sounds.map((snd) => (
              <option key={snd.id} value={snd.id} className="dark:bg-slate-900">
                {snd.emoji ? `${snd.emoji} ` : ""}{snd.name} ({snd.category})
              </option>
            ))}
          </select>
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
            <select
              value={channelTarget}
              onChange={(e) => setChannelTarget(e.target.value)}
              className="glass-input w-full py-1.5 px-3 text-xs text-slate-900 dark:text-white"
            >
              <option value="all" className="dark:bg-slate-900">Todos los canales del servidor</option>
              <option value="voice_only" className="dark:bg-slate-900">Solo en canales de voz</option>
              <option value="text_only" className="dark:bg-slate-900">Solo en canales de texto</option>
            </select>
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
