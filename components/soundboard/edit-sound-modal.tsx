"use client";

import { useEffect, useState } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { EmojiPicker } from "@/components/soundboard/emoji-picker";
import { SoundCategory, SoundItem } from "@/lib/mock-data";
import { Button } from "@heroui/react";
import { Pencil, Trash2, User, Globe } from "lucide-react";

export function EditSoundModal({
  sound,
  onClose,
}: {
  sound: SoundItem | null;
  onClose: () => void;
}) {
  const { editCustomSound, deleteCustomSound } = useBot();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [category, setCategory] = useState<SoundCategory>("memes");
  const [scope, setScope] = useState<"mine" | "all">("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sound) {
      setName(sound.name);
      setEmoji(sound.emoji || "");
      const isMine = Boolean(
        sound.uploadedBy &&
        sound.uploadedBy.trim() !== "" &&
        sound.uploadedBy !== "null"
      );
      setScope(isMine ? "mine" : "all");
      setConfirmDelete(false);
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
      scope,
    });
    setIsSaving(false);

    if (!ok) {
      setError("No se pudo guardar los cambios. Revisa la conexión con el bot e inténtalo de nuevo.");
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!sound || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const ok = await deleteCustomSound(sound.id);
      setIsDeleting(false);
      if (ok) {
        onClose();
      } else {
        setError("No se pudo eliminar el sonido.");
      }
    } catch {
      setIsDeleting(false);
      setError("Error al intentar eliminar el sonido.");
    }
  };

  return (
    <GlassModal
      isOpen={!!sound}
      onClose={onClose}
      maxWidth="md"
      icon={<Pencil size={20} />}
      title="Editar sonido"
      subtitle={sound ? `«${sound.name}» — cambios en el catálogo de sonidos` : undefined}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  isDisabled={isDeleting}
                  onPress={handleDelete}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs h-8 px-2.5 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>{isDeleting ? "Borrando..." : "¿Confirmar borrar?"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={isDeleting}
                  onPress={() => setConfirmDelete(false)}
                  className="text-xs h-8 text-slate-400 cursor-pointer px-2"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setConfirmDelete(true)}
                className="text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 text-xs h-8 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Eliminar sonido</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              isDisabled={isSaving || isDeleting}
              className="text-slate-600 dark:text-slate-300 cursor-pointer text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-sound-form"
              size="sm"
              isDisabled={isSaving || isDeleting}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer text-xs h-8"
            >
              <span>{isSaving ? "Guardando..." : "Guardar cambios"}</span>
            </Button>
          </div>
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

        <div className="grid grid-cols-2 gap-3 items-start">
          <div>
            <div className="flex items-center justify-between mb-1 h-5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Emoji
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
            </div>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 h-5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Categoría
              </label>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SoundCategory)}
              className="glass-input w-full h-10 px-3.5 text-xs text-slate-900 dark:text-white"
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
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Pertenencia / Ámbito
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setScope("mine")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                scope === "mine"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30"
                  : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${scope === "mine" ? "bg-emerald-500/20 text-emerald-500" : "bg-black/5 dark:bg-white/5 text-slate-400"}`}>
                <User size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Propio (Mío)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  Aparece en &quot;Propios&quot;
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScope("all")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                scope === "all"
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30"
                  : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${scope === "all" ? "bg-purple-500/20 text-purple-400" : "bg-black/5 dark:bg-white/5 text-slate-400"}`}>
                <Globe size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  De todos (Público)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  Sonido global para el bot
                </div>
              </div>
            </button>
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
