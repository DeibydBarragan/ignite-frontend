import { z } from "zod";
import { httpRequest, type Result } from "@/lib/http";
import type { GuildVoiceSettings } from "../types/voice-types";

const voiceBindingSchema = z.object({
  phrase: z.string(),
  command_id: z.enum([
    "play",
    "enqueue",
    "skip",
    "pause",
    "resume",
    "stop",
    "previous",
    "shuffle",
    "volume",
    "queue",
  ]),
});

const guildVoiceSettingsSchema = z.object({
  enabled: z.boolean(),
  wake_word: z.string(),
  language: z.string(),
  tts_feedback_enabled: z.boolean(),
  tts_templates: z.record(z.string(), z.string()),
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
