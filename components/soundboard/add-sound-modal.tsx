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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_BYTES = 5 * 1024 * 1024;
  const ACCEPTED_EXTS = [".mp3", ".ogg", ".oga", ".wav", ".webm", ".m4a"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setAudioFile(null);
      return;
    }
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      setError("Formato no soportado. Usa mp3, ogg, wav, webm o m4a.");
      setAudioFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("El archivo supera el límite de 5 MB.");
      setAudioFile(null);
      return;
    }
    setAudioFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUploading) return;

    setIsUploading(true);
    setError(null);
    const ok = await addCustomSound({
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      category,
      file: audioFile || undefined,
    });
    setIsUploading(false);

    if (!ok) {
      setError("No se pudo guardar el sonido. Revisa la conexión con el bot e inténtalo de nuevo.");
      return;
    }

    setName("");
    setEmoji("🔔");
    setAudioFile(null);
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
            isDisabled={isUploading}
            className="bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span>{isUploading ? "Subiendo..." : "Guardar sonido"}</span>
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

        <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Archivo de Audio (Opcional)
            </label>
            <input
              type="file"
              accept=".mp3,.ogg,.oga,.wav,.webm,.m4a,audio/*"
              onChange={handleFileChange}
              className="glass-input w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {audioFile
                ? `Seleccionado: ${audioFile.name} (${(audioFile.size / 1024).toFixed(0)} KB) — sonará en Discord.`
                : "Sin archivo solo sonará en tu navegador (preview). Con .mp3 sonará en el canal de voz."}
            </span>
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </GlassModal>
  );
}
