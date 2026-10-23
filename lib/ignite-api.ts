import { z } from "zod";
import type {
  ApiGuild,
  ApiPlayerState,
  ApiVoiceChannel,
  ApiVoiceStatus,
  Song,
} from "@/types/domain";
import { httpRequest } from "@/lib/http";
import {
  controlResponseSchema,
  guildListResponseSchema,
  playResponseSchema,
  playerStateResponseSchema,
  recommendationsResponseSchema,
  resolvePlaylistResponseSchema,
  searchResponseSchema,
  suggestionsResponseSchema,
  topSongsResponseSchema,
  voiceChannelListResponseSchema,
  voiceStatusResponseSchema,
  queueActionSchema,
  undoSchema,
} from "@/lib/schemas/music";

export type {
  ApiPlayerState,
  ApiGuild,
  ApiVoiceMember,
  ApiVoiceChannel,
  ApiVoiceStatus,
} from "@/types/domain";

const healthSchema = z.object({
  status: z.string(),
  uptime: z.number().optional(),
  bot: z.unknown().optional(),
});

type ControlAction =
  | "pause" | "resume" | "toggle" | "skip" | "previous"
  | "stop" | "seek" | "volume" | "loop" | "shuffle" | "autoplay" | "filter";

export function musicUrl(path: string): string {
  return `/api/music/${path.replace(/^\/+/, "")}`;
}

class IgniteApiClient {
  /** Compat: el cliente ya no resuelve el upstream, lo hace el BFF. */
  async getBaseUrl(): Promise<string> {
    return "/api/music";
  }

  async getHealth(): Promise<{ status: string; uptime?: number; bot?: unknown } | null> {
    const res = await httpRequest(musicUrl("health"), healthSchema, { method: "GET" });
    if (!res.ok) return null;
    return res.data;
  }

  async getGuilds(): Promise<ApiGuild[]> {
    const res = await httpRequest(musicUrl("guilds"), guildListResponseSchema, { method: "GET" });
    if (!res.ok) return [];
    return res.data.guilds;
  }

  async getVoiceChannels(guildId: string): Promise<ApiVoiceChannel[]> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/channels`),
      voiceChannelListResponseSchema,
      { method: "GET" }
    );
    if (!res.ok) return [];
    return res.data.channels;
  }

  async getVoiceStatus(guildId: string, userId?: string): Promise<ApiVoiceStatus | null> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/voice-status${qs}`),
      voiceStatusResponseSchema,
      { method: "GET" }
    );
    if (!res.ok) return null;
    return res.data;
  }

  async getPlayerState(guildId: string): Promise<ApiPlayerState | null> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/player`),
      playerStateResponseSchema,
      { method: "GET", timeoutMs: 5000 }
    );
    if (!res.ok) return null;
    return res.data;
  }

  async play(
    guildId: string,
    params: { query: string; voiceChannelId?: string; userId?: string; next?: boolean; skip?: boolean }
  ): Promise<{ success: boolean; song?: Song; playlist?: { name: string | null; count: number }; error?: string }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/play`),
      playResponseSchema,
      { method: "POST", body: JSON.stringify(params), timeoutMs: 10000 }
    );
    if (!res.ok) {
      return { success: false, error: res.error || "El servicio del bot está desconectado o no responde" };
    }
    if (!res.data.success) {
      return { success: false, error: res.data.error || "No se pudo reproducir" };
    }
    return {
      success: true,
      song: res.data.song ?? undefined,
      playlist: res.data.playlist ?? undefined,
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100 || /^https?:\/\//i.test(q)) return [];
    const res = await httpRequest(
      musicUrl(`search/suggest?q=${encodeURIComponent(q)}`),
      suggestionsResponseSchema,
      { method: "GET", timeoutMs: 5000 }
    );
    if (!res.ok) return [];
    return res.data.suggestions;
  }

  async searchVideos(query: string, limit = 6): Promise<Song[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100 || /^https?:\/\//i.test(q)) return [];
    const res = await httpRequest(
      musicUrl(`search?q=${encodeURIComponent(q)}&limit=${limit}`),
      searchResponseSchema,
      { method: "GET", timeoutMs: 8000 }
    );
    if (!res.ok) return [];
    return res.data.results;
  }

  async control(
    guildId: string,
    action: ControlAction,
    value?: string | number | boolean | null
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/control`),
      controlResponseSchema,
      { method: "POST", body: JSON.stringify({ action, value }), timeoutMs: 8000 }
    );
    if (!res.ok) {
      return { success: false, error: res.error || "El servicio del bot está desconectado o no responde" };
    }
    return { success: res.data.success, message: res.data.message, error: res.data.error };
  }

  async resolvePlaylist(
    guildId: string,
    url: string
  ): Promise<{ success: boolean; tracks?: Song[]; error?: string }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/playlist/resolve?url=${encodeURIComponent(url)}`),
      resolvePlaylistResponseSchema,
      { method: "GET" }
    );
    if (!res.ok) return { success: false };
    const tracks = res.data.tracks.length > 0 ? res.data.tracks : res.data.songs;
    if (tracks.length === 0) return { success: false };
    return { success: true, tracks };
  }

  async removeFromQueue(guildId: string, index: number): Promise<boolean> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/queue/${index}`),
      queueActionSchema,
      { method: "DELETE" }
    );
    return res.ok && res.data.success;
  }

  /** Elimina por identidad estable (sobrevive reordenamientos concurrentes). */
  async removeTrackFromQueue(guildId: string, trackId: string): Promise<boolean> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/queue/items/${encodeURIComponent(trackId)}`),
      queueActionSchema,
      { method: "DELETE" }
    );
    return res.ok && res.data.success;
  }

  async moveInQueue(guildId: string, from: number, to: number): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/queue/move`),
      queueActionSchema,
      { method: "POST", body: JSON.stringify({ from, to }) }
    );
    if (!res.ok) return { success: false, error: res.error };
    return { success: res.data.success, message: res.data.message, error: res.data.error };
  }

  async jumpInQueue(guildId: string, position: number): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/queue/jump`),
      queueActionSchema,
      { method: "POST", body: JSON.stringify({ position }) }
    );
    if (!res.ok) return { success: false, error: res.error };
    return { success: res.data.success, message: res.data.message, error: res.data.error };
  }

  async clearQueue(guildId: string): Promise<boolean> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/queue`),
      queueActionSchema,
      { method: "DELETE" }
    );
    return res.ok && res.data.success;
  }

  async undoClearQueue(guildId: string): Promise<{ success: boolean; restored?: number; error?: string; code?: string }> {
    const res = await httpRequest(musicUrl(`guilds/${encodeURIComponent(guildId)}/queue/undo`), undoSchema, { method: "POST" });
    if (!res.ok) return { success: false, error: res.error, code: res.code };
    return { success: res.data.success, restored: res.data.restored, error: res.data.error };
  }

  async getRecommendations(
    guildId: string,
    options?: { force?: boolean }
  ): Promise<{ success: boolean; source: "radio" | "top" | "empty"; basedOn: Song | null; songs: Song[] }> {
    const query = options?.force ? "?force=true" : "";
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/recommendations${query}`),
      recommendationsResponseSchema,
      { method: "GET" }
    );
    if (!res.ok) return { success: false, source: "empty", basedOn: null, songs: [] };
    return { success: true, source: res.data.source, basedOn: res.data.basedOn, songs: res.data.songs };
  }

  async getTopSongs(guildId: string, timeframe: "week" | "month" | "all" = "week", limit = 100): Promise<{ success: boolean; songs: Song[] }> {
    const res = await httpRequest(
      musicUrl(`guilds/${encodeURIComponent(guildId)}/top-songs?timeframe=${timeframe}&limit=${limit}`),
      topSongsResponseSchema,
      { method: "GET" }
    );
    if (!res.ok) return { success: false, songs: [] };
    return { success: true, songs: res.data.songs };
  }

  async getDevMode(): Promise<boolean> {
    const devModeSchema = z.object({
      success: z.boolean(),
      devMode: z.boolean(),
      userId: z.string().nullable().optional(),
    });
    const res = await httpRequest(musicUrl("user/dev-mode"), devModeSchema, { method: "GET" });
    return res.ok && res.data.devMode;
  }

  async setDevMode(enabled: boolean): Promise<boolean> {
    const devModeSchema = z.object({
      success: z.boolean(),
      devMode: z.boolean(),
      userId: z.string().nullable().optional(),
    });
    const res = await httpRequest(musicUrl("user/dev-mode"), devModeSchema, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    return res.ok && res.data.devMode;
  }
}

export const igniteApi = new IgniteApiClient();
