import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_DEFAULT_GUILD_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_USE_MOCKS: z.enum(["true", "false"]).optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  IGNITE_API_SECRET: z.string().min(16),
  IGNITE_API_URL: z.string().url().optional(),
  SOUND_API_URL: z.string().url().optional(),
  DISCORD_CLIENT_ID: z.string().min(1).optional(),
  DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
});

function parsePublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEFAULT_GUILD_ID: process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID,
    NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS,
  });
}

export const publicEnv = parsePublicEnv();

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
