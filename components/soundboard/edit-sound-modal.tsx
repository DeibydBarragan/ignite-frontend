"use client";

import { useEffect, useState } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { EmojiPicker } from "@/components/soundboard/emoji-picker";
import { SoundCategory, SoundItem } from "@/lib/mock-data";
import { Button } from "@heroui/react";
import { Pencil } from "lucide-react";

export function EditSoundModal({
  sound,
  onClose,
}: {
  sound: SoundItem | null;
  onClose: () => void;
}) {
  const { editCustomSound } = useBot();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [category, setCategory] = useState<SoundCategory>("memes");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sound) {
      setName(sound.name);
      setEmoji(sound.emoji || "");
      setCategory(sound.category);
      setError(null);
    }
  }, [sound]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sound || !name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    const ok = await editCustomSound(sound.id, {
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      category,
    });
    setIsSaving(false);

    if (!ok) {
      setError("No se pudo guardar los cambios. Revisa la conexión con el bot e inténtalo de nuevo.");
      return;
    }
    onClose();
  };

  return (
    <GlassModal
      isOpen={!!sound}
      onClose={onClose}
      maxWidth="md"
      icon={<Pencil size={20} />}
      title="Editar sonido"
      subtitle={sound ? `«${sound.name}» — el cambio lo verá todo el mundo` : undefined}
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
            form="edit-sound-form"
            size="sm"
            isDisabled={isSaving}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span>{isSaving ? "Guardando..." : "Guardar cambios"}</span>
          </Button>
        </div>
      }
    >
      <form id="edit-sound-form" onSubmit={handleSubmit} className="space-y-4">
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
              Emoji
            </label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
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

        <p className="text-[11px] text-slate-400">
          Para cambiar el audio hay que usar el icono ⬆️ del pad (reemplaza el .mp3).
        </p>

        {error && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </GlassModal>
  );
}
