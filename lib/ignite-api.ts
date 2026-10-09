import { Song } from "./mock-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_IGNITE_API_URL ||
  "https://wsnbbnbdc7.execute-api.us-east-2.amazonaws.com/music";

const API_SECRET =
  process.env.NEXT_PUBLIC_IGNITE_API_SECRET || "ignite_dev_secret_2026_xyz";

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

  async getHealth(): Promise<{ status: string; uptime: number; bot: any } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
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
      const res = await fetch(`${API_BASE_URL}/api/guilds`, {
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/channels`, {
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
      const url = userId
        ? `${API_BASE_URL}/api/guilds/${guildId}/voice-status?userId=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/api/guilds/${guildId}/voice-status`;
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/player`, {
        headers: this.headers,
        cache: "no-store",
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
  ): Promise<{ success: boolean; song?: Song; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/play`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return {
        success: true,
        song: data.song,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100 || /^https?:\/\//i.test(q)) return [];
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/search/suggest?q=${encodeURIComponent(q)}`,
        { headers: this.headers, cache: "no-store" }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    } catch {
      return [];
    }
  }

  async control(
    guildId: string,
    action: "pause" | "resume" | "toggle" | "skip" | "previous" | "stop" | "seek" | "volume" | "loop" | "shuffle" | "autoplay" | "filter",
    value?: any
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/control`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ action, value }),
      });
      const data = await res.json();
      return { success: data.success ?? res.ok, message: data.message };
    } catch {
      return { success: false };
    }
  }

  async resolvePlaylist(
    guildId: string,
    url: string
  ): Promise<{ success: boolean; tracks?: Song[]; error?: string }> {
    // Intenta resolver una playlist en el backend. Si el endpoint aún no existe,
    // devuelve success:false para que el frontend use el fallback local.
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/guilds/${guildId}/playlist/resolve?url=${encodeURIComponent(url)}`,
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/queue/${index}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/queue/move`, {
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/queue/jump`, {
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
      const res = await fetch(`${API_BASE_URL}/api/guilds/${guildId}/queue`, {
        method: "DELETE",
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const igniteApi = new IgniteApiClient();
