import type { Song } from "@/types/domain";
import { supabase } from "@/lib/supabase/client";

export const FALLBACK_ALBUM_ART =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";

type FavoriteRow = {
  song_id: string | null;
  title: string;
  artist: string;
  album_art: string | null;
  url: string;
  duration: number | null;
  source: string | null;
  is_lyric: boolean | null;
};

function rowToSong(item: FavoriteRow): Song {
  return {
    id: item.song_id || item.url,
    title: item.title,
    artist: item.artist,
    albumArt: item.album_art || FALLBACK_ALBUM_ART,
    duration: item.duration || 180,
    source: (item.source as Song["source"]) || "youtube",
    url: item.url,
    category: "hits",
    isLyric: item.is_lyric ?? false,
  };
}

const FAVORITE_COLUMNS = "song_id,title,artist,album_art,url,duration,source,is_lyric";
const LEGACY_FAVORITE_COLUMNS = "song_id,title,artist,album_art,url,duration,source";

function favoritesQuery(uid: string, columns: string) {
  return supabase
    .from("user_favorites")
    .select(columns)
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .range(0, 49);
}

export async function fetchFavoriteSongs(uid: string): Promise<Song[]> {
  let { data, error } = await favoritesQuery(uid, FAVORITE_COLUMNS);
  if (error && error.code === "42703") {
    // La BD aún no tiene la columna is_lyric (migración pendiente): reintentar sin ella.
    ({ data, error } = await favoritesQuery(uid, LEGACY_FAVORITE_COLUMNS));
  }
  if (error) throw error;
  const rows = (data ?? []) as unknown as FavoriteRow[];
  return rows.map(rowToSong);
}

function toRow(uid: string, song: Song, withLyric: boolean) {
  return {
    user_id: uid,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    album_art: song.albumArt,
    url: song.url,
    duration: song.duration,
    source: song.source,
    ...(withLyric ? { is_lyric: song.isLyric ?? false } : {}),
  };
}

export async function insertFavorite(uid: string, song: Song): Promise<void> {
  const { error } = await supabase.from("user_favorites").insert(toRow(uid, song, true));
  if (!error) return;
  const { error: retryError } = await supabase
    .from("user_favorites")
    .insert(toRow(uid, song, false));
  if (retryError) throw retryError;
}

export async function insertFavoriteRows(uid: string, songs: Song[]): Promise<void> {
  const { error } = await supabase
    .from("user_favorites")
    .insert(songs.map((s) => toRow(uid, s, true)));
  if (!error) return;
  const { error: retryError } = await supabase
    .from("user_favorites")
    .insert(songs.map((s) => toRow(uid, s, false)));
  if (retryError) throw retryError;
}

export async function deleteFavorite(uid: string, song: Song): Promise<void> {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", uid)
    .or(`song_id.eq.${song.id},url.eq.${song.url}`);
  if (error) throw error;
}

export async function deleteFavoritesByKeys(
  uid: string,
  urls: string[],
  ids: string[]
): Promise<void> {
  if (urls.length > 0) {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", uid)
      .in("url", urls);
    if (error) throw error;
  }
  if (ids.length > 0) {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", uid)
      .in("song_id", ids);
    if (error) throw error;
  }
}
