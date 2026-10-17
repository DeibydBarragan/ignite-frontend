import { z } from "zod";

export const voiceItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  gender: z.string().min(1),
  lang: z.string().min(1),
  flag: z.string().min(1),
  provider: z.string().min(1),
  description: z.string().optional(),
});

export const voicesResponseSchema = z.object({
  voices: z.array(voiceItemSchema).default([]),
});

export const soundboardTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional(),
  category: z.string().min(1),
  duration: z.number().nonnegative(),
  preset: z.string().optional(),
  playsCount: z.number().nonnegative(),
  file: z.string().nullable().optional(),
  hasFile: z.boolean().optional(),
  uploadedBy: z.string().nullable().optional(),
  lastPlayedAt: z.number().nullable().optional(),
});

export const soundsResponseSchema = z.object({
  sounds: z.array(soundboardTrackSchema).default([]),
});

export const speakTtsResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const playSoundResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  channel: z.object({ id: z.string(), name: z.string() }).optional(),
});

export const mutateSoundResponseSchema = z.object({
  success: z.boolean(),
  sound: soundboardTrackSchema.optional(),
  error: z.string().optional(),
});
