"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { DiscordUser, PhraseTrigger, SoundItem } from "@/types/domain";
import { soundApi } from "@/lib/sound-api";
import { saveStoredSoundScope, saveStoredRecentPlayed } from "@/lib/sound-storage";
import { logger } from "@/lib/logger";
import type { ToastOptions, ToastType } from "@/components/ui/toast";

interface SoundCrudParams {
  isLoggedIn: boolean;
  user: DiscordUser | null;
  sounds: SoundItem[];
  setSounds: Dispatch<SetStateAction<SoundItem[]>>;
  setPhraseTriggers: Dispatch<SetStateAction<PhraseTrigger[]>>;
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

export interface SoundCrudValue {
  addCustomSound: (soundData: {
    name: string;
    emoji?: string;
    category: SoundItem["category"];
    file?: File;
    scope?: "mine" | "all";
  }) => Promise<boolean>;
  editCustomSound: (
    soundId: string,
    data: {
      name: string;
      emoji?: string;
      category: SoundItem["category"];
      scope?: "mine" | "all";
      uploadedBy?: string | null;
    }
  ) => Promise<boolean>;
  deleteCustomSound: (soundId: string) => Promise<boolean>;
  attachSoundAudio: (soundId: string, file: File) => Promise<boolean>;
}

export function useSoundCrud({
  isLoggedIn,
  user,
  sounds,
  setSounds,
  setPhraseTriggers,
  toast,
}: SoundCrudParams): SoundCrudValue {
  const addCustomSound = useCallback(
    async (soundData: {
      name: string;
      emoji?: string;
      category: SoundItem["category"];
      file?: File;
      scope?: "mine" | "all";
    }) => {
      const isMine = soundData.scope !== "all";
      const uploadedBy = isMine ? user?.id || "750899475404292126" : null;
      const now = Date.now();

      if (soundData.file) {
        const res = await soundApi.uploadSound({
          name: soundData.name,
          emoji: soundData.emoji,
          category: soundData.category,
          file: soundData.file,
          userId: uploadedBy || undefined,
        });
        if (!res.success || !res.sound) {
          toast(res.error || "No se pudo subir el sonido al catálogo.", "error");
          return false;
        }
        const s = res.sound;
        const newSound: SoundItem = {
          id: s.id,
          name: s.name,
          emoji: s.emoji || soundData.emoji || "🎵",
          category: (s.category as SoundItem["category"]) || soundData.category,
          duration: s.duration ?? 2,
          preset: "tada",
          playsCount: s.playsCount ?? 0,
          hasFile: true,
          uploadedBy,
          lastPlayedAt: now,
        };
        saveStoredSoundScope(newSound.id, isMine ? "mine" : "all");
        saveStoredRecentPlayed(newSound.id, now);
        setSounds((prev) => [newSound, ...prev]);
        toast(`Sonido "${newSound.name}" subido correctamente al catálogo.`, "success", {
          duration: 3500,
        });
        return true;
      }

      const newSound: SoundItem = {
        id: "snd-" + Date.now(),
        name: soundData.name,
        emoji: soundData.emoji || "🎵",
        category: soundData.category,
        duration: 2,
        preset: "tada",
        playsCount: 0,
        hasFile: false,
        uploadedBy,
        lastPlayedAt: now,
      };
      saveStoredSoundScope(newSound.id, isMine ? "mine" : "all");
      saveStoredRecentPlayed(newSound.id, now);
      setSounds((prev) => [newSound, ...prev]);
      toast(`Sonido "${newSound.name}" guardado en el catálogo local.`, "success", {
        duration: 3000,
      });
      return true;
    },
    [user?.id, setSounds, toast]
  );

  const editCustomSound = useCallback(
    async (
      soundId: string,
      data: {
        name: string;
        emoji?: string;
        category: SoundItem["category"];
        scope?: "mine" | "all";
        uploadedBy?: string | null;
      }
    ) => {
      const trimmed = data.name.trim();
      if (!trimmed) return false;

      const newUploadedBy =
        data.uploadedBy !== undefined
          ? data.uploadedBy
          : data.scope !== undefined
            ? data.scope === "all"
              ? null
              : user?.id || "750899475404292126"
            : undefined;

      if (data.scope !== undefined) {
        saveStoredSoundScope(soundId, data.scope);
      } else if (newUploadedBy !== undefined) {
        saveStoredSoundScope(soundId, newUploadedBy ? "mine" : "all");
      }

      const res = await soundApi.updateSound(soundId, {
        name: trimmed,
        emoji: data.emoji?.trim() || undefined,
        category: data.category,
        uploadedBy: newUploadedBy,
      });

      if (!res.success && !sounds.some((s) => s.id === soundId)) {
        const errMsg = res.error || "No se pudo actualizar el sonido.";
        toast(errMsg, "error");
        return false;
      }

      const s = res.sound;
      setSounds((prev) =>
        prev.map((x) =>
          x.id === soundId
            ? {
                ...x,
                name: s?.name || trimmed,
                emoji: s?.emoji || data.emoji?.trim() || x.emoji,
                category: (s?.category as SoundItem["category"]) || data.category,
                uploadedBy:
                  newUploadedBy !== undefined ? newUploadedBy : (s?.uploadedBy ?? x.uploadedBy),
              }
            : x
        )
      );
      toast(`Sonido "${trimmed}" actualizado correctamente.`, "success", { duration: 2500 });
      return true;
    },
    [user?.id, sounds, setSounds, toast]
  );

  const deleteCustomSound = useCallback(
    async (soundId: string) => {
      const target = sounds.find((s) => s.id === soundId);
      if (!target) return false;

      saveStoredSoundScope(soundId, null);
      saveStoredRecentPlayed(soundId, 0);

      try {
        await soundApi.deleteSound(soundId);
      } catch (e) {
        logger.warn("deleteSound API error:", e);
      }

      setSounds((prev) => prev.filter((s) => s.id !== soundId));
      setPhraseTriggers((prev) => prev.filter((t) => t.soundId !== soundId));
      toast(`Sonido "${target.name}" eliminado del catálogo.`, "success", { duration: 3000 });
      return true;
    },
    [sounds, setSounds, setPhraseTriggers, toast]
  );

  const attachSoundAudio = useCallback(
    async (soundId: string, file: File) => {
      if (!isLoggedIn) return false;
      const res = await soundApi.attachSoundFile(soundId, file);
      if (!res.success || !res.sound) {
        const errMsg = res.error || "No se pudo adjuntar el audio al sonido.";
        toast(errMsg, "error");
        return false;
      }
      const s = res.sound;
      setSounds((prev) =>
        prev.map((x) =>
          x.id === soundId
            ? {
                ...x,
                duration: s.duration ?? x.duration,
                playsCount: s.playsCount ?? x.playsCount,
                hasFile: true,
              }
            : x
        )
      );
      toast(`Audio adjuntado a "${s.name}" correctamente.`, "success", { duration: 3500 });
      return true;
    },
    [isLoggedIn, setSounds, toast]
  );

  return { addCustomSound, editCustomSound, deleteCustomSound, attachSoundAudio };
}
