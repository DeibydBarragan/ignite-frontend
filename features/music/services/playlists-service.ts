import { supabase } from "@/lib/supabase/client";
import type { Song, UserPlaylist } from "@/types/domain";
import { detectPlaylistSource, derivePlaylistName } from "@/lib/formatters";
import { STORAGE_KEYS, migrateLegacyKeys } from "@/lib/storage-keys";
import { logger } from "@/lib/logger";
import { userPlaylistRowSchema } from "@/lib/schemas/supabase";

export type { UserPlaylist };
export { detectPlaylistSource, derivePlaylistName };
export { timeAgo } from "@/lib/formatters";

export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80";

const LOCAL_STORAGE_KEY = STORAGE_KEYS.userPlaylists;

function genId(prefix = "pl"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function getLocalPlaylists(): UserPlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    migrateLegacyKeys();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserPlaylist[]) : [];
  } catch {
    return [];
  }
}

function setLocalPlaylists(playlists: UserPlaylist[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playlists));
  } catch {
    // QuotaExceededError: mantener estado en memoria.
  }
}

type PlaylistRow = {
  id: unknown;
  user_id?: unknown;
  name?: unknown;
  source?: unknown;
  url?: unknown;
  cover?: unknown;
  tracks?: unknown;
  synced_at?: unknown;
  created_at?: unknown;
};

function mapRowToPlaylist(item: PlaylistRow): UserPlaylist {
  const rawTracks = Array.isArray(item.tracks) ? item.tracks : [];
  const tracks: Song[] = rawTracks.map((t: unknown, idx: number) => {
    const r = (t ?? {}) as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : `${String(item.id)}-track-${idx}`;
    const title = typeof r.title === "string" && r.title.length > 0 ? r.title : "Pista sin título";
    const artist = typeof r.artist === "string" && r.artist.length > 0 ? r.artist : "Desconocido";
    const albumArt =
      (typeof r.albumArt === "string" && r.albumArt.length > 0 ? r.albumArt : null) ??
      (typeof r.album_art === "string" && (r.album_art as string).length > 0
        ? (r.album_art as string)
        : null) ??
      (typeof item.cover === "string" && (item.cover as string).length > 0
        ? (item.cover as string)
        : FALLBACK_COVER);
    const duration = typeof r.duration === "number" && Number.isFinite(r.duration) ? r.duration : 180;
    const source: Song["source"] = r.source === "spotify" || r.source === "youtube" ? r.source : "youtube";
    if (typeof item.source === "string" && (item.source === "spotify" || item.source === "youtube")) {
      // prefer row source fallback handled below
    }
    const url = typeof r.url === "string" && r.url.length > 0 ? r.url : typeof item.url === "string" ? (item.url as string) : "";
    return {
      id,
      title,
      artist,
      albumArt,
      duration,
      source,
      url,
      category: "hits" as const,
    };
  });
  const parsed = userPlaylistRowSchema.safeParse({
    id: item.id,
    user_id: typeof item.user_id === "string" ? item.user_id : undefined,
    name: item.name,
    source: item.source,
    url: item.url,
    cover: item.cover,
    tracks,
    synced_at: item.synced_at ?? null,
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
  });
  if (parsed.success) {
    return {
      id: parsed.data.id,
      user_id: parsed.data.user_id ?? undefined,
      name: parsed.data.name,
      source: parsed.data.source,
      url: parsed.data.url,
      cover: parsed.data.cover || tracks[0]?.albumArt || FALLBACK_COVER,
      tracks: parsed.data.tracks,
      synced_at: parsed.data.synced_at ?? null,
      created_at: parsed.data.created_at,
    };
  }
  return {
    id: String(item.id ?? genId("pl")),
    user_id: typeof item.user_id === "string" ? item.user_id : undefined,
    name: typeof item.name === "string" && item.name.length > 0 ? item.name : "Playlist sin nombre",
    source: item.source === "spotify" || item.source === "youtube" ? item.source : "spotify",
    url: typeof item.url === "string" ? item.url : "",
    cover:
      (typeof item.cover === "string" && item.cover.length > 0 ? item.cover : null) ??
      tracks[0]?.albumArt ??
      FALLBACK_COVER,
    tracks,
    synced_at: typeof item.synced_at === "string" ? item.synced_at : null,
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
  };
}

export async function fetchUserPlaylists(userId?: string): Promise<UserPlaylist[]> {
  const local = getLocalPlaylists();
  try {
    let query = supabase
      .from("user_playlists")
      .select("id,user_id,name,source,url,cover,tracks,synced_at,created_at")
      .order("created_at", { ascending: false })
      .range(0, 49);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error || !data) {
      if (error) logger.warn("[fetchUserPlaylists] Supabase error:", error.message);
      return local;
    }
    if (data.length === 0) return local;
    const mapped = (data as unknown as PlaylistRow[]).map(mapRowToPlaylist);
    setLocalPlaylists(mapped);
    return mapped;
  } catch (err) {
    logger.warn("[fetchUserPlaylists] error:", err);
    return local;
  }
}

export async function createUserPlaylist(input: {
  url: string;
  name?: string;
  userId?: string;
}): Promise<UserPlaylist> {
  const url = input.url.trim();
  const newPlaylist: UserPlaylist = {
    id: genId("pl"),
    user_id: input.userId,
    name: derivePlaylistName(url, input.name),
    source: detectPlaylistSource(url),
    url,
    cover: FALLBACK_COVER,
    tracks: [],
    synced_at: null,
    created_at: new Date().toISOString(),
  };

  const previous = getLocalPlaylists();
  setLocalPlaylists([newPlaylist, ...previous]);

  try {
    const { error } = await supabase.from("user_playlists").insert({
      id: newPlaylist.id,
      user_id: newPlaylist.user_id,
      name: newPlaylist.name,
      source: newPlaylist.source,
      url: newPlaylist.url,
      cover: newPlaylist.cover,
      tracks: [],
      synced_at: null,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    // Revertir optimista: no fingir éxito (fin divergencia fantasma).
    setLocalPlaylists(previous);
    logger.error("[createUserPlaylist] Supabase error:", err);
    throw err instanceof Error ? err : new Error("No se pudo guardar la playlist en Supabase");
  }

  return newPlaylist;
}

export async function updatePlaylistSnapshot(
  id: string,
  snapshot: { tracks: Song[]; cover?: string }
): Promise<void> {
  const synced_at = new Date().toISOString();
  const previous = getLocalPlaylists();
  setLocalPlaylists(
    previous.map((p) =>
      p.id === id
        ? { ...p, tracks: snapshot.tracks, cover: snapshot.cover || p.cover, synced_at }
        : p
    )
  );

  try {
    const { error } = await supabase
      .from("user_playlists")
      .update({ tracks: snapshot.tracks, cover: snapshot.cover, synced_at })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    setLocalPlaylists(previous);
    logger.error("[updatePlaylistSnapshot] Supabase error:", err);
    throw err instanceof Error ? err : new Error("No se pudo sincronizar la playlist en Supabase");
  }
}

export async function deleteUserPlaylist(id: string): Promise<boolean> {
  const previous = getLocalPlaylists();
  setLocalPlaylists(previous.filter((p) => p.id !== id));
  try {
    const { error } = await supabase.from("user_playlists").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    setLocalPlaylists(previous);
    logger.error("[deleteUserPlaylist] Supabase error:", err);
    throw err instanceof Error ? err : new Error("No se pudo eliminar la playlist en Supabase");
  }
}
