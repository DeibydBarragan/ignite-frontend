"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { SoundItem } from "@/lib/mock-data";
import { Button } from "@heroui/react";
import { Trash2, AlertTriangle, Volume2 } from "lucide-react";

export function DeleteSoundModal({
  sound,
  onClose,
}: {
  sound: SoundItem | null;
  onClose: () => void;
}) {
  const { deleteCustomSound } = useBot();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sound) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const ok = await deleteCustomSound(sound.id);
      if (!ok) {
        setError("No se pudo eliminar el sonido. Inténtalo de nuevo.");
        setIsDeleting(false);
        return;
      }
      setIsDeleting(false);
      onClose();
    } catch {
      setError("Ocurrió un error al intentar eliminar el sonido.");
      setIsDeleting(false);
    }
  };

  return (
    <GlassModal
      isOpen={!!sound}
      onClose={onClose}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Eliminar sonido"
      subtitle={`¿Seguro que deseas eliminar «${sound.name}»?`}
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
            <Trash2 size={14} />
            <span>{isDeleting ? "Eliminando..." : "Eliminar definitivamente"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Sound info preview badge */}
        <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-2xl shrink-0">
            {sound.emoji ? sound.emoji : <Volume2 size={22} className="text-purple-400" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {sound.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="capitalize">{sound.category}</span>
              <span>·</span>
              <span>{sound.playsCount} reproducciones</span>
              {sound.uploadedBy ? (
                <>
                  <span>·</span>
                  <span className="text-emerald-500 font-semibold">Propio</span>
                </>
              ) : (
                <>
                  <span>·</span>
                  <span className="text-purple-400 font-semibold">De todos</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta acción eliminará el sonido del catálogo del Soundboard de forma permanente. Si estaba vinculado a un disparador Phrase-to-Sound, se desvinculará automáticamente.
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
