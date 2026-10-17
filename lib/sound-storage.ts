import type { SoundItem, SoundboardTrack } from "@/types/domain";
import { STORAGE_KEYS, migrateLegacyKeys } from "@/lib/storage-keys";

export const SOUND_PRESETS: SoundItem["preset"][] = [
  "airhorn", "violin", "tada", "badumtss", "bruh",
  "quack", "alarm", "levelup", "victory", "applause",
];

const SCOPES_STORAGE_KEY = STORAGE_KEYS.soundScopes;
const RECENT_PLAYED_KEY = STORAGE_KEYS.soundRecentPlayed;

export function getStoredSoundScopes(): Record<string, "mine" | "all"> {
  if (typeof window === "undefined") return {};
  try {
    migrateLegacyKeys();
    const raw = localStorage.getItem(SCOPES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, "mine" | "all">;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveStoredSoundScope(soundId: string, scope: "mine" | "all" | null) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSoundScopes();
    if (scope === null) {
      delete current[soundId];
    } else {
      current[soundId] = scope;
    }
    localStorage.setItem(SCOPES_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // storage bloqueado o lleno: mantener en memoria.
  }
}

export function getStoredRecentPlayed(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    migrateLegacyKeys();
    const raw = localStorage.getItem(RECENT_PLAYED_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveStoredRecentPlayed(soundId: string, timestamp = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredRecentPlayed();
    if (timestamp <= 0) {
      delete current[soundId];
    } else {
      current[soundId] = timestamp;
    }
    localStorage.setItem(RECENT_PLAYED_KEY, JSON.stringify(current));
  } catch {
    // storage bloqueado o lleno: mantener en memoria.
  }
}

export function mapRemoteSound(r: SoundboardTrack): SoundItem {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    category: (["memes", "gaming", "reactions", "sfx", "anime"] as const).includes(
      r.category as SoundItem["category"]
    )
      ? (r.category as SoundItem["category"])
      : "memes",
    duration: r.duration || 2,
    preset: (SOUND_PRESETS as string[]).includes(r.preset || "")
      ? (r.preset as SoundItem["preset"])
      : "tada",
    playsCount: r.playsCount ?? 0,
    hasFile: r.hasFile ?? false,
    uploadedBy: r.uploadedBy ?? null,
    lastPlayedAt: r.lastPlayedAt ?? null,
  };
}
