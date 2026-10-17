"use client";

import { useState } from "react";
import { useSoundboard } from "@/context/soundboard-context";
import { GlassModal } from "@/components/ui/glass-modal";
import { EmojiPicker } from "./emoji-picker";
import { GlassSelect } from "@/components/ui/glass-select";
import { SoundScopeSelector } from "./sound-scope-selector";
import type { SoundCategory, SoundItem } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";

function deriveScope(sound: SoundItem | null): "mine" | "all" {
  if (!sound) return "all";
  const isMine = Boolean(
    sound.uploadedBy &&
    sound.uploadedBy.trim() !== "" &&
    sound.uploadedBy !== "null"
  );
  return isMine ? "mine" : "all";
}

export function EditSoundModal({
  sound,
  onClose,
}: {
  sound: SoundItem | null;
  onClose: () => void;
}) {
  const { editCustomSound, deleteCustomSound } = useSoundboard();
  const [name, setName] = useState(sound?.name ?? "");
  const [emoji, setEmoji] = useState(sound?.emoji ?? "");
  const [category, setCategory] = useState<SoundCategory>("memes");
  const [scope, setScope] = useState<"mine" | "all">(() => deriveScope(sound));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{isDeleting ? "Eliminando" : "¿Confirmar borrar?"}</span>
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
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              <span>{isSaving ? "Guardando" : "Guardar cambios"}</span>
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
            <GlassSelect
              value={category}
              onChange={(val) => setCategory(val as SoundCategory)}
              options={[
                { value: "memes", label: "Memes" },
                { value: "gaming", label: "Gaming" },
                { value: "reactions", label: "Reacciones" },
                { value: "sfx", label: "Efectos SFX" },
                { value: "anime", label: "Anime" },
              ]}
              size="md"
            />
          </div>
        </div>

        <SoundScopeSelector scope={scope} onChange={setScope} />

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
