import { supabase } from "@/lib/supabase";

export interface SavedPhrase {
  id: string;
  user_id?: string;
  title: string;
  text: string;
  voice: string;
  pitch: number;
  rate: number;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "ignite_saved_phrases";

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
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PRESET_PHRASES));
      return DEFAULT_PRESET_PHRASES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PRESET_PHRASES;
  }
}

function setLocalPhrases(phrases: SavedPhrase[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(phrases));
  } catch {}
}

export async function fetchSavedPhrases(userId?: string): Promise<SavedPhrase[]> {
  const local = getLocalPhrases();

  try {
    let query = supabase.from("saved_phrases").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      // Si la tabla aún no existe en Supabase o falló la conexión, devolver local
      return local;
    }

    // Si Supabase tiene datos, combinamos o usamos los de Supabase
    if (data.length > 0) {
      const mapped: SavedPhrase[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title || "Frase sin título",
        text: item.text || "",
        voice: item.voice || "es-MX-DaliaNeural",
        pitch: Number(item.pitch) || 1.0,
        rate: Number(item.rate) || 1.0,
        created_at: item.created_at,
      }));
      setLocalPhrases(mapped);
      return mapped;
    }

    return local;
  } catch {
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

  // Guardar localmente
  const current = getLocalPhrases();
  setLocalPhrases([newPhrase, ...current]);

  // Intentar guardar en Supabase
  try {
    await supabase.from("saved_phrases").insert({
      id: newPhrase.id,
      user_id: newPhrase.user_id,
      title: newPhrase.title,
      text: newPhrase.text,
      voice: newPhrase.voice,
      pitch: newPhrase.pitch,
      rate: newPhrase.rate,
    });
  } catch (err) {
    console.warn("[createSavedPhrase] Supabase error:", err);
  }

  return newPhrase;
}

export async function deleteSavedPhrase(id: string): Promise<boolean> {
  // Eliminar localmente
  const current = getLocalPhrases();
  setLocalPhrases(current.filter((p) => p.id !== id));

  // Intentar eliminar de Supabase
  try {
    await supabase.from("saved_phrases").delete().eq("id", id);
    return true;
  } catch {
    return true;
  }
}
