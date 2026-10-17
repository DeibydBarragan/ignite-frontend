"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PhraseTrigger, SoundItem } from "@/types/domain";
import { MOCK_SOUNDS, MOCK_PHRASE_TRIGGERS } from "@/lib/mock-data";
import { soundApi } from "@/lib/sound-api";
import { saveStoredRecentPlayed } from "@/lib/sound-storage";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useRemoteSounds } from "@/hooks/use-remote-sounds";
import { useSoundCrud, type SoundCrudValue } from "@/hooks/use-sound-crud";
import { useToast } from "@/components/ui/toast";

export interface SoundboardContextValue extends SoundCrudValue {
  sounds: SoundItem[];
  activeSoundId: string | null;
  playSound: (soundId: string) => void;
  phraseTriggers: PhraseTrigger[];
  addPhraseTrigger: (trigger: {
    phrase: string;
    soundId: string;
    exactMatch: boolean;
    channelTarget: string;
  }) => void;
  togglePhraseTrigger: (id: string) => void;
  deletePhraseTrigger: (id: string) => void;
  simulatePhraseDetection: (triggerId: string) => void;
}

const SoundboardContext = createContext<SoundboardContextValue | null>(null);

export function SoundboardProvider({ children }: { children: ReactNode }) {
  const auth = useAuthCore();
  const volume = usePlayerStore((s) => s.volume);
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  const [sounds, setSounds] = useState<SoundItem[]>(() =>
    process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_SOUNDS : []
  );
  const [phraseTriggers, setPhraseTriggers] = useState<PhraseTrigger[]>(() =>
    process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_PHRASE_TRIGGERS : []
  );
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useRemoteSounds(auth.isLoggedIn, setSounds);

  const playSound = useCallback(
    (soundId: string) => {
      if (!auth.isLoggedIn) return;
      const sound = sounds.find((s) => s.id === soundId);
      if (!sound) return;

      setActiveSoundId(soundId);
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = setTimeout(() => {
        setActiveSoundId(null);
      }, sound.duration * 1000);

      const now = Date.now();
      saveStoredRecentPlayed(soundId, now);
      setSounds((prev) =>
        prev.map((s) =>
          s.id === soundId ? { ...s, playsCount: s.playsCount + 1, lastPlayedAt: now } : s
        )
      );

      const channelName = auth.currentVoiceChannel?.name || "General";

      soundApi
        .playSoundOnDiscord({
          guildId: auth.selectedGuildId,
          channelId: auth.currentVoiceChannel?.id,
          soundId,
          volume,
        })
        .then((res) => {
          addLiveEvent({
            type: "soundboard",
            title: res.success ? "Soundboard en Discord" : "No se pudo emitir",
            description: res.success
              ? `Efecto ${sound.emoji || "🔊"} '${sound.name}' emitido en ${res.channel?.name || channelName}`
              : res.code === "NO_AUDIO_FILE"
                ? `Efecto ${sound.emoji || "🔊"} '${sound.name}' sin audio en el bot — súbelo con el icono ⬆️ del pad`
                : res.error || "No se pudo emitir el sonido en Discord",
          });
        })
        .catch(() => {
          addLiveEvent({
            type: "soundboard",
            title: "No se pudo emitir",
            description: `Efecto ${sound.emoji || "🔊"} '${sound.name}' — bot no alcanzable`,
          });
        });
    },
    [
      auth.isLoggedIn,
      auth.selectedGuildId,
      auth.currentVoiceChannel,
      sounds,
      volume,
      setSounds,
      addLiveEvent,
    ]
  );

  const crud = useSoundCrud({
    isLoggedIn: auth.isLoggedIn,
    user: auth.user,
    sounds,
    setSounds,
    setPhraseTriggers,
    toast,
  });

  const addPhraseTrigger = useCallback(
    (data: { phrase: string; soundId: string; exactMatch: boolean; channelTarget: string }) => {
      if (!auth.isLoggedIn) return;
      const targetSound = sounds.find((s) => s.id === data.soundId);
      if (!targetSound) return;

      const newTrigger: PhraseTrigger = {
        id: "trg-" + Date.now(),
        phrase: data.phrase,
        soundId: data.soundId,
        soundName: targetSound.name,
        soundEmoji: targetSound.emoji,
        exactMatch: data.exactMatch,
        enabled: true,
        channelTarget: data.channelTarget,
        triggerCount: 0,
      };

      setPhraseTriggers((prev) => [newTrigger, ...prev]);
    },
    [auth.isLoggedIn, sounds]
  );

  const togglePhraseTrigger = useCallback(
    (id: string) => {
      if (!auth.isLoggedIn) return;
      setPhraseTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
    },
    [auth.isLoggedIn]
  );

  const deletePhraseTrigger = useCallback(
    (id: string) => {
      if (!auth.isLoggedIn) return;
      setPhraseTriggers((prev) => prev.filter((t) => t.id !== id));
    },
    [auth.isLoggedIn]
  );

  const simulatePhraseDetection = useCallback(
    (triggerId: string) => {
      if (!auth.isLoggedIn) return;
      const trigger = phraseTriggers.find((t) => t.id === triggerId);
      if (!trigger || !trigger.enabled) return;

      playSound(trigger.soundId);

      setPhraseTriggers((prev) =>
        prev.map((t) =>
          t.id === triggerId
            ? { ...t, triggerCount: t.triggerCount + 1, lastTriggered: "Ahora mismo" }
            : t
        )
      );

      addLiveEvent({
        type: "voice_trigger",
        title: "Disparador de Frase Detectado",
        description: `Alguien dijo '${trigger.phrase}' en Discord ➜ Sonido ${trigger.soundEmoji || "🔊"} ${trigger.soundName}`,
      });
    },
    [auth.isLoggedIn, phraseTriggers, playSound, addLiveEvent]
  );

  const value = useMemo<SoundboardContextValue>(
    () => ({
      sounds,
      activeSoundId,
      playSound,
      phraseTriggers,
      addPhraseTrigger,
      togglePhraseTrigger,
      deletePhraseTrigger,
      simulatePhraseDetection,
      ...crud,
    }),
    [
      sounds,
      activeSoundId,
      playSound,
      phraseTriggers,
      addPhraseTrigger,
      togglePhraseTrigger,
      deletePhraseTrigger,
      simulatePhraseDetection,
      crud,
    ]
  );

  return <SoundboardContext.Provider value={value}>{children}</SoundboardContext.Provider>;
}

export function useSoundboard(): SoundboardContextValue {
  const ctx = useContext(SoundboardContext);
  if (!ctx) throw new Error("useSoundboard must be used within a SoundboardProvider");
  return ctx;
}
