import { z } from "zod";

export const songSchema = z.object({
  id: z.string().min(1),
  trackId: z.string().min(1).optional(),
  title: z.string().min(1),
  artist: z.string().min(1),
  albumArt: z.string().min(1),
  coverUrl: z.string().nullable().optional(),
  duration: z.number().nonnegative(),
  formattedDuration: z.string().optional(),
  source: z.enum(["youtube", "spotify"]),
  url: z.string().min(1),
  category: z.enum(["lofi", "gaming", "synthwave", "hits", "rock"]).catch("hits"),
  isLyric: z.boolean().optional(),
  isAutoplay: z.boolean().optional(),
  isLive: z.boolean().optional(),
  playCount: z.number().optional(),
  rank: z.number().optional(),
  requestedBy: z
    .object({
      id: z.string(),
      username: z.string(),
      avatar: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export const apiPlayerStateSchema = z.object({
  hasQueue: z.boolean(),
  isPlaying: z.boolean(),
  isPaused: z.boolean(),
  currentTime: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  volume: z.number().min(0).max(100),
  repeatMode: z.enum(["off", "track", "queue"]),
  autoplay: z.boolean(),
  filter: z.string().nullable(),
  voiceChannel: z.object({ id: z.string(), name: z.string() }).nullable().default(null),
  currentSong: songSchema.nullable().default(null),
  queue: z.array(songSchema).default([]),
  disconnectReason: z.string().nullable().default(null),
});

export const apiGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  memberCount: z.number().nonnegative(),
});

export const apiVoiceMemberSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  bot: z.boolean(),
});

export const apiVoiceChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  bitrate: z.number().nonnegative(),
  userLimit: z.number().nonnegative(),
  userCount: z.number().nonnegative(),
  botPresent: z.boolean(),
  members: z.array(apiVoiceMemberSchema),
});

export const apiVoiceStatusSchema = z.object({
  bot: z.object({ id: z.string(), name: z.string() }).nullable(),
  user: z.object({ id: z.string(), name: z.string() }).nullable(),
  canControl: z.boolean(),
});

export const guildListResponseSchema = z.object({
  guilds: z.array(apiGuildSchema).default([]),
});

export const voiceChannelListResponseSchema = z.object({
  channels: z.array(apiVoiceChannelSchema).default([]),
});

export const voiceStatusResponseSchema = apiVoiceStatusSchema;

export const playerStateResponseSchema = apiPlayerStateSchema;

export const playResponseSchema = z.object({
  success: z.boolean(),
  started: z.boolean().optional(),
  position: z.number().optional(),
  // El bot devuelve `null` explícito cuando no hay canción/playlist resuelta.
  song: songSchema.nullish(),
  playlist: z
    .object({ name: z.string().nullable(), count: z.number(), truncated: z.boolean().optional() })
    .nullish(),
  error: z.string().optional(),
});

export const controlResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const resolvePlaylistResponseSchema = z.object({
  success: z.boolean().optional(),
  count: z.number().optional(),
  truncated: z.boolean().optional(),
  tracks: z.array(songSchema).default([]),
  songs: z.array(songSchema).default([]),
});

export const recommendationsResponseSchema = z.object({
  source: z.enum(["radio", "top", "empty"]).default("empty"),
  basedOn: songSchema.nullable().default(null),
  songs: z.array(songSchema).default([]),
});

export const topSongsResponseSchema = z.object({
  songs: z.array(songSchema).default([]),
});

export const suggestionsResponseSchema = z.object({
  suggestions: z.array(z.string()).default([]),
});

export const searchResponseSchema = z.object({
  results: z.array(songSchema).default([]),
});

export const queueActionSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const undoSchema = z.object({
  success: z.boolean().default(true),
  restored: z.number().optional(),
  error: z.string().optional(),
});
