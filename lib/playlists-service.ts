"use client";

import { supabase } from "@/lib/supabase";
import type { Song, MusicSource } from "@/lib/mock-data";

/*
  Modelo híbrido: el LINK es la fuente de verdad (la playlist viva en
  Spotify/YouTube/SoundCloud). `tracks` + `cover` son solo un SNAPSHOT
  (caché de lectura) que se refresca cada vez que se abre la playlist.
  `synced_at` indica cuándo se sincronizó por última vez.

  SQL para Supabase (ejecutar una vez en el dashboard):

  create table if not exists user_playlists (
    id text primary key,
    user_id text not null,
    name text not null,
    source text not null default 'spotify',
    url text not null,
    cover text,
    tracks jsonb not null default '[]'::jsonb,
    synced_at timestamptz,
    created_at timestamptz default now()
  );
  create unique index if not exists user_playlists_user_url
    on user_playlists (user_id, url);
  alter table user_playlists enable row level security;
  create policy "users manage own playlists"
    on user_playlists for all
    using (true)
    with check (true);
*/

export interface UserPlaylist {
  id: string;
  user_id?: string;
  name: string;
  source: MusicSource;
  url: string;
  cover: string;
  /** Snapshot de lectura (puede estar desactualizado). La verdad vive en `url`. */
  tracks: Song[];
  /** Cuándo se sincronizó el snapshot con la plataforma. null = nunca. */
  synced_at?: string | null;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "ignite_user_playlists";

export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80";

function genId(prefix = "pl"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function detectPlaylistSource(url: string): MusicSource {
  const lower = url.toLowerCase();
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("soundcloud.com")) return "soundcloud";
  return "spotify";
}

export function derivePlaylistName(url: string, customName?: string): string {
  const wanted = customName?.trim().slice(0, 60);
  if (wanted) return wanted;
  try {
    const u = new URL(url.trim());
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "Playlist";
    return decodeURIComponent(last).replace(/[-_]+/g, " ").slice(0, 60) || "Nueva playlist";
  } catch {
    return "Nueva playlist";
  }
}

function getLocalPlaylists(): UserPlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalPlaylists(playlists: UserPlaylist[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playlists));
  } catch {}
}

function mapRowToPlaylist(item: any): UserPlaylist {
  const tracks: Song[] = Array.isArray(item.tracks)
    ? item.tracks.map((t: any, idx: number) => ({
        id: t.id || `${item.id}-track-${idx}`,
        title: t.title || "Pista sin título",
        artist: t.artist || "Desconocido",
        albumArt: t.albumArt || t.album_art || item.cover || FALLBACK_COVER,
        duration: Number(t.duration) || 180,
        source: (t.source as Song["source"]) || item.source || "spotify",
        url: t.url || item.url,
        category: "hits" as const,
      }))
    : [];
  return {
    id: item.id,
    user_id: item.user_id,
    name: item.name || "Playlist sin nombre",
    source: (item.source as MusicSource) || "spotify",
    url: item.url,
    cover: item.cover || tracks[0]?.albumArt || FALLBACK_COVER,
    tracks,
    synced_at: item.synced_at ?? null,
    created_at: item.created_at,
  };
}

export async function fetchUserPlaylists(userId?: string): Promise<UserPlaylist[]> {
  const local = getLocalPlaylists();
  try {
    let query = supabase.from("user_playlists").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error || !data) return local;
    if (data.length === 0) return local;
    const mapped = data.map(mapRowToPlaylist);
    setLocalPlaylists(mapped);
    return mapped;
  } catch {
    return local;
  }
}

/**
 * Importar = guardar SOLO el link (instantáneo, sin resolver).
 * Los temas se sincronizan al abrir la playlist.
 */
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

  const current = getLocalPlaylists();
  setLocalPlaylists([newPlaylist, ...current]);

  try {
    await supabase.from("user_playlists").insert({
      id: newPlaylist.id,
      user_id: newPlaylist.user_id,
      name: newPlaylist.name,
      source: newPlaylist.source,
      url: newPlaylist.url,
      cover: newPlaylist.cover,
      tracks: [],
      synced_at: null,
    });
  } catch (err) {
    console.warn("[createUserPlaylist] Supabase error:", err);
  }

  return newPlaylist;
}

/**
 * Guardar el snapshot recién sincronizado (tracks + cover + synced_at).
 */
export async function updatePlaylistSnapshot(
  id: string,
  snapshot: { tracks: Song[]; cover?: string }
): Promise<void> {
  const synced_at = new Date().toISOString();

  const current = getLocalPlaylists();
  setLocalPlaylists(
    current.map((p) =>
      p.id === id
        ? { ...p, tracks: snapshot.tracks, cover: snapshot.cover || p.cover, synced_at }
        : p
    )
  );

  try {
    await supabase
      .from("user_playlists")
      .update({ tracks: snapshot.tracks, cover: snapshot.cover, synced_at })
      .eq("id", id);
  } catch (err) {
    console.warn("[updatePlaylistSnapshot] Supabase error:", err);
  }
}

export async function deleteUserPlaylist(id: string): Promise<boolean> {
  const current = getLocalPlaylists();
  setLocalPlaylists(current.filter((p) => p.id !== id));
  try {
    await supabase.from("user_playlists").delete().eq("id", id);
    return true;
  } catch {
    return true;
  }
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "nunca sincronizada";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 0) return "ahora mismo";
  if (s < 60) return "actualizada ahora mismo";
  const m = Math.floor(s / 60);
  if (m < 60) return `actualizada hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `actualizada hace ${h} h`;
  const d = Math.floor(h / 24);
  return `actualizada hace ${d} d`;
}
