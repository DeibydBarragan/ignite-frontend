import { z } from "zod";
import { songSchema } from "./music";

export const userPlaylistRowSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().nullable().optional(),
  name: z.string().min(1),
  source: z.enum(["youtube", "spotify"]),
  url: z.string().min(1),
  cover: z.string().min(1),
  tracks: z.array(songSchema).default([]),
  synced_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const savedPhraseRowSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().nullable().optional(),
  title: z.string().min(1),
  text: z.string().min(1),
  voice: z.string().min(1),
  pitch: z.number().min(0.1).max(3),
  rate: z.number().min(0.1).max(3),
  created_at: z.string().optional(),
});

export const userFavoriteRowSchema = z.object({
  song_id: z.string().min(1),
  user_id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  album_art: z.string().nullable().optional(),
  url: z.string().min(1),
  duration: z.number().nonnegative().optional(),
  source: z.enum(["youtube", "spotify"]).optional(),
  is_lyric: z.boolean().optional(),
});
