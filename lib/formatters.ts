import type { MusicSource, Song } from "@/types/domain";

export function totalDuration(tracks: Song[]): number {
  return tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
}

export function formatDuration(sec: number): string {
  const safe = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function formatRelativeTime(ts: number | null | undefined): string | null {
  if (ts == null || !Number.isFinite(ts)) return null;
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return "ahora mismo";
  const s = Math.floor(diffMs / 1000);
  if (s < 10) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "nunca sincronizada";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "nunca sincronizada";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 0) return "ahora mismo";
  if (s < 60) return "actualizada ahora mismo";
  const m = Math.floor(s / 60);
  if (m < 60) return `actualizada hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `actualizada hace ${h} h`;
  const d = Math.floor(h / 24);
  return `actualizada hace ${d} d`;
}

export function detectPlatform(text: string): "spotify" | "youtube" | null {
  const lower = text.toLowerCase();
  if (lower.includes("spotify.com") || lower.includes("spotify:")) return "spotify";
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("music.youtube.com")
  ) {
    return "youtube";
  }
  return null;
}

export function detectPlaylistSource(url: string): MusicSource {
  const lower = url.toLowerCase();
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
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

export function getSongExternalUrl(song: {
  url?: string;
  source?: string;
  id?: string;
  title?: string;
  artist?: string;
}): string {
  const rawUrl = song.url?.trim();
  if (rawUrl && /^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const isSpotify = song.source === "spotify" || rawUrl?.includes("spotify.com");
  const query = `${song.title || ""} ${song.artist || ""}`.trim();

  if (isSpotify) {
    if (song.id && !song.id.includes(" ") && !song.id.startsWith("mock-")) {
      return `https://open.spotify.com/track/${song.id}`;
    }
    return `https://open.spotify.com/search/${encodeURIComponent(query || "music")}`;
  }

  // Default to YouTube
  if (song.id && !song.id.includes(" ") && !song.id.startsWith("mock-") && song.id.length >= 6) {
    return `https://www.youtube.com/watch?v=${song.id}`;
  }

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query || "music")}`;
}
