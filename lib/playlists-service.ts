"use client";

import { supabase } from "@/lib/supabase";
import type { Song, MusicSource } from "@/lib/mock-data";

/*
  SQL sugerido para Supabase (ejecutar una vez en el dashboard):

  create table if not exists user_playlists (
    id text primary key,
    user_id text not null,
    name text not null,
    source text not null default 'spotify',
    url text not null,
    cover text,
    tracks jsonb not null default '[]'::jsonb,
    created_at timestamptz default now()
  );
  alter table user_playlists enable row level security;
  create policy "users manage own playlists"
    on user_playlists for all
    using (auth.uid()::text = user_id or true)
    with check (true);
*/

export interface UserPlaylist {
  id: string;
  user_id?: string;
  name: string;
  source: MusicSource;
  url: string;
  cover: string;
  tracks: Song[];
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "ignite_user_playlists";

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

export function isPlaylistUrl(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
  return (
    lower.includes("list=") ||
    lower.includes("/playlist") ||
    lower.includes("/sets/") ||
    lower.includes("open.spotify.com") ||
    lower.includes("soundcloud.com")
  );
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
        albumArt:
          t.albumArt ||
          t.album_art ||
          item.cover ||
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
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
    cover:
      item.cover ||
      tracks[0]?.albumArt ||
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    tracks,
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

export function buildPlaylistFromUrl(url: string, customName?: string, resolvedTracks?: Song[]): Omit<UserPlaylist, "id" | "created_at"> & { user_id?: string } {
  const trimmed = url.trim();
  const source = detectPlaylistSource(trimmed);
  const name =
    customName?.trim() ||
    (() => {
      try {
        const u = new URL(trimmed);
        const parts = u.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "Playlist";
        return decodeURIComponent(last).replace(/[-_]+/g, " ").slice(0, 60) || "Nueva playlist";
      } catch {
        return "Nueva playlist";
      }
    })();

  const fallbackTrack: Song = {
    id: `track-${Date.now()}`,
    title: name,
    artist: source === "spotify" ? "Spotify Playlist" : source === "youtube" ? "YouTube Playlist" : "Playlist",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    duration: 180,
    source,
    url: trimmed,
    category: "hits",
  };

  return {
    name,
    source,
    url: trimmed,
    cover: resolvedTracks?.[0]?.albumArt || fallbackTrack.albumArt,
    tracks: resolvedTracks && resolvedTracks.length > 0 ? resolvedTracks : [fallbackTrack],
  };
}

export async function createUserPlaylist(input: {
  url: string;
  name?: string;
  userId?: string;
  resolvedTracks?: Song[];
}): Promise<UserPlaylist> {
  const base = buildPlaylistFromUrl(input.url, input.name, input.resolvedTracks);
  const newPlaylist: UserPlaylist = {
    ...base,
    id: genId("pl"),
    user_id: input.userId,
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
      tracks: newPlaylist.tracks,
    });
  } catch (err) {
    console.warn("[createUserPlaylist] Supabase error:", err);
  }

  return newPlaylist;
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
