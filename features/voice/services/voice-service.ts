import { z } from "zod";
import { httpRequest, type Result } from "@/lib/http";
import type { GuildVoiceSettings, VoiceLogEntry } from "../types/voice-types";

const voiceBindingSchema = z.object({
  phrase: z.string(),
  command_id: z.enum([
    "play",
    "play_next",
    "enqueue",
    "skip",
    "pause",
    "resume",
    "stop",
    "previous",
    "shuffle",
    "autoplay_on",
    "autoplay_off",
    "volume",
    "queue",
  ]),
});

const guildVoiceSettingsSchema = z.object({
  enabled: z.boolean(),
  wake_word: z.string(),
  language: z.string(),
  tts_feedback_enabled: z.boolean(),
  tts_voice: z.string().optional().default("es-MX-DaliaNeural"),
  tts_pitch: z.number().optional().default(1.0),
  tts_rate: z.number().optional().default(1.0),
  tts_templates: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .transform((tpls) => {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(tpls)) {
        if (!k.startsWith("_") && typeof v === "string") {
          clean[k] = v;
        }
      }
      return clean;
    }),
  bindings: z.array(voiceBindingSchema),
});

export async function fetchGuildVoiceSettings(
  guildId: string
): Promise<Result<GuildVoiceSettings>> {
  return httpRequest<GuildVoiceSettings>(
    `/api/music/guilds/${encodeURIComponent(guildId)}/voice`,
    guildVoiceSettingsSchema,
    { method: "GET" }
  );
}

export async function updateGuildVoiceSettings(
  guildId: string,
  settings: Partial<GuildVoiceSettings>
): Promise<Result<GuildVoiceSettings>> {
  return httpRequest<GuildVoiceSettings>(
    `/api/music/guilds/${encodeURIComponent(guildId)}/voice`,
    guildVoiceSettingsSchema,
    {
      method: "PUT",
      body: JSON.stringify(settings),
    }
  );
}

export async function resetGuildVoiceSettings(
  guildId: string
): Promise<Result<GuildVoiceSettings>> {
  return httpRequest<GuildVoiceSettings>(
    `/api/music/guilds/${encodeURIComponent(guildId)}/voice/reset`,
    guildVoiceSettingsSchema,
    { method: "POST" }
  );
}

const voiceLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  guildId: z.string(),
  userId: z.string().nullable().optional(),
  audioBytes: z.number().default(0),
  voskHeard: z.string().default(""),
  wakeWordSpotted: z.boolean().default(false),
  matchedWakeWord: z.string().nullable().optional(),
  gateReason: z.string().nullable().optional(),
  groqEngaged: z.boolean().default(false),
  groqText: z.string().nullable().optional(),
  groqElapsedMs: z.number().nullable().optional(),
  commandId: z.string().nullable().optional(),
  query: z.string().nullable().optional(),
  ttsMessage: z.string().nullable().optional(),
  status: z.string().default("filtered_out"),
});

const voiceLogsResponseSchema = z.object({
  logs: z.array(voiceLogEntrySchema),
});

export async function fetchVoiceLogs(
  guildId: string,
  limit = 50
): Promise<Result<{ logs: VoiceLogEntry[] }>> {
  return httpRequest<{ logs: VoiceLogEntry[] }>(
    `/api/music/guilds/${encodeURIComponent(guildId)}/voice/logs?limit=${limit}`,
    voiceLogsResponseSchema,
    { method: "GET" }
  );
}

export async function clearVoiceLogs(
  guildId: string
): Promise<Result<{ ok: boolean }>> {
  return httpRequest<{ ok: boolean }>(
    `/api/music/guilds/${encodeURIComponent(guildId)}/voice/logs`,
    z.object({ ok: z.boolean() }),
    { method: "DELETE" }
  );
}
