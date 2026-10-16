import { Song } from "./mock-data";
import { supabase } from "./supabase";

// URL fija como fallback (Vercel env). El bot puede anunciar su URL real
// en Supabase (tabla bot_status) y el dashboard la descubre en runtime,
// así cambiar de PC/túnel no requiere tocar Vercel.
const ENV_API_BASE_URL = (
  process.env.NEXT_PUBLIC_IGNITE_API_URL ||
  "https://ministry-bacteria-approach-galaxy.trycloudflare.com"
).replace(/\/+$/, "");

const API_SECRET =
  process.env.NEXT_PUBLIC_IGNITE_API_SECRET || "ignite_dev_secret_2026_xyz";

// Caché del descubrimiento + antigüedad máxima aceptada del anuncio.
// Si el anuncio es más viejo, el bot probablemente cayó y se usa la env.
const DISCOVERY_TTL_MS = 5 * 60 * 1000;
const DISCOVERY_MAX_AGE_MS = 10 * 60 * 1000;

let discoveredBase: string | null = null;
let discoveredAt = 0;
let discoveryInflight: Promise<string> | null = null;

function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

async function discoverBaseUrl(): Promise<string> {
  const now = Date.now();
  if (discoveredBase && now - discoveredAt < DISCOVERY_TTL_MS) {
    return discoveredBase;
  }
  if (discoveryInflight) return discoveryInflight;
  discoveryInflight = (async () => {
    try {
      const { data } = await supabase
        .from("bot_status")
        .select("api_url,updated_at")
        .eq("id", "music")
        .maybeSingle();
      const announced = cleanUrl((data as { api_url?: unknown } | null)?.api_url);
      const age =
        data?.updated_at != null
          ? now - new Date(data.updated_at as string).getTime()
          : Infinity;
      if (announced && age < DISCOVERY_MAX_AGE_MS) {
        discoveredBase = announced;
        discoveredAt = Date.now();
        return announced;
      }
    } catch {
      // Sin tabla o sin red: fallback a la env.
    }
    discoveredBase = ENV_API_BASE_URL;
    discoveredAt = Date.now();
    return ENV_API_BASE_URL;
  })();
  try {
    return await discoveryInflight;
  } finally {
    discoveryInflight = null;
  }
}

export interface ApiPlayerState {
  hasQueue: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: "off" | "track" | "queue";
  autoplay: boolean;
  filter: string | null;
  voiceChannel: { id: string; name: string } | null;
  currentSong: Song | null;
  queue: Song[];
  disconnectReason?: string | null;
}

export interface ApiGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

export interface ApiVoiceMember {
  id: string;
  username: string;
  avatar: string | null;
  bot: boolean;
}

export interface ApiVoiceChannel {
  id: string;
  name: string;
  bitrate: number;
  userLimit: number;
  userCount: number;
  botPresent: boolean;
  members: ApiVoiceMember[];
}

export interface ApiVoiceStatus {
  bot: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
  canControl: boolean;
}

class IgniteApiClient {
  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (API_SECRET) {
      headers["Authorization"] = `Bearer ${API_SECRET}`;
    }
    return headers;
  }

  /** URL base efectiva (descubierta en runtime o fallback a la env). */
  async getBaseUrl(): Promise<string> {
    return discoverBaseUrl();
  }

  async getHealth(): Promise<{ status: string; uptime: number; bot: any } | null> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/health`, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getGuilds(): Promise<ApiGuild[]> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds`, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.guilds || [];
    } catch {
      return [];
    }
  }

  async getVoiceChannels(guildId: string): Promise<ApiVoiceChannel[]> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/channels`, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.channels || [];
    } catch {
      return [];
    }
  }

  async getVoiceStatus(guildId: string, userId?: string): Promise<ApiVoiceStatus | null> {
    try {
      const base = await discoverBaseUrl();
      const url = userId
        ? `${base}/api/guilds/${guildId}/voice-status?userId=${encodeURIComponent(userId)}`
        : `${base}/api/guilds/${guildId}/voice-status`;
      const res = await fetch(url, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getPlayerState(guildId: string): Promise<ApiPlayerState | null> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/player`, {
        headers: this.headers,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async play(
    guildId: string,
    params: { query: string; voiceChannelId?: string; userId?: string; next?: boolean; skip?: boolean }
  ): Promise<{ success: boolean; song?: Song; playlist?: { name: string | null; count: number }; error?: string }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/play`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data.error || `Error ${res.status}` };
      return {
        success: true,
        song: data.song,
        playlist: data.playlist,
      };
    } catch {
      return { success: false, error: "El servicio del bot está desconectado o no responde" };
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100 || /^https?:\/\//i.test(q)) return [];
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(
        `${base}/api/search/suggest?q=${encodeURIComponent(q)}`,
        { headers: this.headers, cache: "no-store", signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return [];
      const data = await res.json().catch(() => ({}));
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    } catch {
      return [];
    }
  }

  async searchVideos(query: string, limit: number = 6): Promise<Song[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100 || /^https?:\/\//i.test(q)) return [];
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(
        `${base}/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
        { headers: this.headers, cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [];
      const data = await res.json().catch(() => ({}));
      return Array.isArray(data.results) ? data.results : [];
    } catch {
      return [];
    }
  }

  async control(
    guildId: string,
    action: "pause" | "resume" | "toggle" | "skip" | "previous" | "stop" | "seek" | "volume" | "loop" | "shuffle" | "autoplay" | "filter",
    value?: any
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/control`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ action, value }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || `Error ${res.status}: ${res.statusText}` };
      }
      return { success: data.success ?? res.ok, message: data.message };
    } catch {
      return { success: false, error: "El servicio del bot está desconectado o no responde" };
    }
  }

  async resolvePlaylist(
    guildId: string,
    url: string
  ): Promise<{ success: boolean; tracks?: Song[]; error?: string }> {
    // Intenta resolver una playlist en el backend. Si el endpoint aún no existe,
    // devuelve success:false para que el frontend use el fallback local.
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(
        `${base}/api/guilds/${guildId}/playlist/resolve?url=${encodeURIComponent(url)}`,
        { headers: this.headers, cache: "no-store" }
      );
      if (!res.ok) return { success: false };
      const data = await res.json();
      const tracks = data.tracks || data.songs || [];
      if (!Array.isArray(tracks) || tracks.length === 0) return { success: false };
      return { success: true, tracks };
    } catch {
      return { success: false };
    }
  }

  async removeFromQueue(guildId: string, index: number): Promise<boolean> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/queue/${index}`, {
        method: "DELETE",
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async moveInQueue(guildId: string, from: number, to: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/queue/move`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async jumpInQueue(guildId: string, position: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/queue/jump`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async clearQueue(guildId: string): Promise<boolean> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/queue`, {
        method: "DELETE",
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async undoClearQueue(guildId: string): Promise<{ success: boolean; restored?: number; error?: string }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/queue/undo`, {
        method: "POST",
        headers: this.headers,
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: data.success ?? true, restored: data.restored };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async getRecommendations(guildId: string): Promise<{ success: boolean; source: "radio" | "top" | "empty"; basedOn: Song | null; songs: Song[] }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/recommendations`, {
        headers: this.headers,
      });
      const data = await res.json();
      if (!res.ok) return { success: false, source: "empty", basedOn: null, songs: [] };
      return {
        success: true,
        source: data.source || "empty",
        basedOn: data.basedOn || null,
        songs: data.songs || [],
      };
    } catch {
      return { success: false, source: "empty", basedOn: null, songs: [] };
    }
  }

  async getTopSongs(guildId: string, timeframe: "week" | "month" | "all" = "week", limit = 100): Promise<{ success: boolean; songs: Song[] }> {
    try {
      const base = await discoverBaseUrl();
      const res = await fetch(`${base}/api/guilds/${guildId}/top-songs?timeframe=${timeframe}&limit=${limit}`, {
        headers: this.headers,
      });
      const data = await res.json();
      if (!res.ok) return { success: false, songs: [] };
      return { success: true, songs: data.songs || [] };
    } catch {
      return { success: false, songs: [] };
    }
  }
}

export const igniteApi = new IgniteApiClient();
