"use client";

import { useEffect, useState } from "react";
import type { VoiceItem } from "@/types/domain";
import { soundApi } from "@/lib/sound-api";
import { FALLBACK_VOICES } from "@/lib/sound-fallbacks";

let cachedVoices: VoiceItem[] | null = null;
let fetchStarted = false;
const listeners = new Set<(voices: VoiceItem[]) => void>();

function publish(voices: VoiceItem[]) {
  cachedVoices = voices;
  listeners.forEach((listener) => listener(voices));
  listeners.clear();
}

export function useVoices(): VoiceItem[] {
  const [voices, setVoices] = useState<VoiceItem[]>(() => cachedVoices ?? FALLBACK_VOICES);

  useEffect(() => {
    if (cachedVoices) return;
    const listener = (next: VoiceItem[]) => setVoices(next);
    listeners.add(listener);
    if (!fetchStarted) {
      fetchStarted = true;
      soundApi
        .getVoices()
        .then((res) => publish(res && res.length > 0 ? res : FALLBACK_VOICES))
        .catch(() => publish(FALLBACK_VOICES));
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return voices;
}
