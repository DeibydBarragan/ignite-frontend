"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { SoundCategory } from "@/lib/mock-data";
import { Button } from "@heroui/react";
import { Plus, Sparkles } from "lucide-react";

export function AddSoundModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addCustomSound } = useBot();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔔");
  const [category, setCategory] = useState<SoundCategory>("memes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomSound({
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      category,
    });

    setName("");
    setEmoji("🔔");
    onClose();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={<Plus size={20} />}
      title="Añadir Sonido al Soundboard"
      subtitle="Registra un nuevo efecto sonoro en la base de datos de sonidos"
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
            form="add-sound-form"
            size="sm"
            className="bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span>Guardar sonido</span>
          </Button>
        </div>
      }
    >
      <form id="add-sound-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Nombre del Sonido
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Victory Fanfare, Bruh Sound, Oof..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Emoji Representativo (Opcional)
            </label>
            <input
              type="text"
              placeholder="📢, 🎻, 🎺, 🤖..."
              value={emoji}
              maxLength={4}
              onChange={(e) => setEmoji(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 text-center text-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SoundCategory)}
              className="glass-input w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="memes" className="dark:bg-slate-900">Memes</option>
              <option value="gaming" className="dark:bg-slate-900">Gaming</option>
              <option value="reactions" className="dark:bg-slate-900">Reacciones</option>
              <option value="sfx" className="dark:bg-slate-900">Efectos SFX</option>
              <option value="anime" className="dark:bg-slate-900">Anime</option>
            </select>
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
