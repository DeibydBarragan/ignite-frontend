import { supabase } from "@/lib/supabase/client";
import type { SavedPhrase } from "@/types/domain";
import { STORAGE_KEYS, migrateLegacyKeys } from "@/lib/storage-keys";
import { logger } from "@/lib/logger";
import { savedPhraseRowSchema } from "@/lib/schemas/supabase";

export type { SavedPhrase };

const LOCAL_STORAGE_KEY = STORAGE_KEYS.savedPhrases;

const DEFAULT_PRESET_PHRASES: SavedPhrase[] = [
  {
    id: "preset-1",
    title: "Bienvenida Loquendo",
    text: "Hola amigos de YouTube bienvenidos a un nuevo video y al canal de Discord.",
    voice: "loquendo",
    pitch: 1.0,
    rate: 1.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-2",
    title: "Comienza la partida",
    text: "¡Listos todos, comienza la partida! Mucha suerte a todos.",
    voice: "es-MX-DaliaNeural",
    pitch: 1.0,
    rate: 1.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-3",
    title: "GG Bien Jugado",
    text: "GG bien jugado a todos los presentes en esta sala.",
    voice: "es-ES-AlvaroNeural",
    pitch: 1.0,
    rate: 1.0,
    created_at: new Date().toISOString(),
  },
];

function getLocalPhrases(): SavedPhrase[] {
  if (typeof window === "undefined") return DEFAULT_PRESET_PHRASES;
  try {
    migrateLegacyKeys();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PRESET_PHRASES));
      return DEFAULT_PRESET_PHRASES;
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPhrase[]) : DEFAULT_PRESET_PHRASES;
  } catch {
    return DEFAULT_PRESET_PHRASES;
  }
}

function setLocalPhrases(phrases: SavedPhrase[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(phrases));
  } catch {
    // QuotaExceededError: mantener estado en memoria.
  }
}

type SavedPhraseRow = {
  id: unknown;
  user_id?: unknown;
  title?: unknown;
  text?: unknown;
  voice?: unknown;
  pitch?: unknown;
  rate?: unknown;
  created_at?: unknown;
};

function mapRow(item: SavedPhraseRow): SavedPhrase {
  const parsed = savedPhraseRowSchema.safeParse({
    id: item.id,
    user_id: typeof item.user_id === "string" ? item.user_id : undefined,
    title: item.title,
    text: item.text,
    voice: item.voice,
    pitch: item.pitch,
    rate: item.rate,
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
  });
  if (parsed.success) {
    return {
      id: parsed.data.id,
      user_id: parsed.data.user_id ?? undefined,
      title: parsed.data.title,
      text: parsed.data.text,
      voice: parsed.data.voice,
      pitch: parsed.data.pitch,
      rate: parsed.data.rate,
      created_at: parsed.data.created_at,
    };
  }
  return {
    id: typeof item.id === "string" ? item.id : `phrase-${Date.now()}`,
    user_id: typeof item.user_id === "string" ? item.user_id : undefined,
    title: typeof item.title === "string" && item.title.length > 0 ? item.title : "Frase sin título",
    text: typeof item.text === "string" ? item.text : "",
    voice: typeof item.voice === "string" ? item.voice : "es-MX-DaliaNeural",
    pitch: typeof item.pitch === "number" && Number.isFinite(item.pitch) ? item.pitch : 1.0,
    rate: typeof item.rate === "number" && Number.isFinite(item.rate) ? item.rate : 1.0,
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
  };
}

export async function fetchSavedPhrases(userId?: string): Promise<SavedPhrase[]> {
  const local = getLocalPhrases();

  try {
    let query = supabase
      .from("saved_phrases")
      .select("id,user_id,title,text,voice,pitch,rate,created_at")
      .order("created_at", { ascending: false })
      .range(0, 49);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      if (error) logger.warn("[fetchSavedPhrases] Supabase error:", error.message);
      return local;
    }

    if (data.length > 0) {
      const mapped = (data as unknown as SavedPhraseRow[]).map(mapRow);
      setLocalPhrases(mapped);
      return mapped;
    }

    return local;
  } catch (err) {
    logger.warn("[fetchSavedPhrases] error:", err);
    return local;
  }
}

export async function createSavedPhrase(phrase: {
  title: string;
  text: string;
  voice: string;
  pitch?: number;
  rate?: number;
  userId?: string;
}): Promise<SavedPhrase> {
  const newPhrase: SavedPhrase = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "phrase-" + Date.now(),
    title: phrase.title.trim(),
    text: phrase.text.trim(),
    voice: phrase.voice,
    pitch: phrase.pitch ?? 1.0,
    rate: phrase.rate ?? 1.0,
    user_id: phrase.userId,
    created_at: new Date().toISOString(),
  };

  const previous = getLocalPhrases();
  setLocalPhrases([newPhrase, ...previous]);

  try {
    const { error } = await supabase.from("saved_phrases").insert({
      id: newPhrase.id,
      user_id: newPhrase.user_id,
      title: newPhrase.title,
      text: newPhrase.text,
      voice: newPhrase.voice,
      pitch: newPhrase.pitch,
      rate: newPhrase.rate,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    setLocalPhrases(previous);
    logger.error("[createSavedPhrase] Supabase error:", err);
    throw err instanceof Error ? err : new Error("No se pudo guardar la frase en Supabase");
  }

  return newPhrase;
}

export async function deleteSavedPhrase(id: string): Promise<boolean> {
  const previous = getLocalPhrases();
  setLocalPhrases(previous.filter((p) => p.id !== id));

  try {
    const { error } = await supabase.from("saved_phrases").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    setLocalPhrases(previous);
    logger.error("[deleteSavedPhrase] Supabase error:", err);
    throw err instanceof Error ? err : new Error("No se pudo eliminar la frase en Supabase");
  }
}
