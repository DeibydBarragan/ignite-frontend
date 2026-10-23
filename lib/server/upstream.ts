import { createClient } from "@supabase/supabase-js";

export class BotOfflineError extends Error {
  constructor(message = "Music bot is offline") {
    super(message);
    this.name = "BotOfflineError";
  }
}

let cachedBase: string | null = null;
let cachedAt = 0;
let inflight: Promise<string> | null = null;

const TTL_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 10 * 60 * 1000;

export function invalidateMusicBaseUrlCache(): void {
  cachedBase = null;
  cachedAt = 0;
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function fallbackBase(): string {
  const raw =
    process.env.IGNITE_API_URL ??
    process.env.NEXT_PUBLIC_IGNITE_API_URL ??
    "";
  const cleaned = cleanUrl(raw);
  if (!cleaned) {
    throw new BotOfflineError(
      "No active music bot tunnel found and no fallback IGNITE_API_URL configured"
    );
  }
  return cleaned;
}

export async function getMusicBaseUrl(): Promise<string> {
  const localEnv = process.env.IGNITE_API_URL ?? process.env.NEXT_PUBLIC_IGNITE_API_URL;
  if (localEnv && (localEnv.includes("localhost") || localEnv.includes("127.0.0.1"))) {
    return cleanUrl(localEnv) || "http://localhost:3001";
  }

  const now = Date.now();
  if (cachedBase && now - cachedAt < TTL_MS) return cachedBase;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon) {
        const sb = createClient(url, anon);
        const { data } = await sb
          .from("bot_status")
          .select("api_url,updated_at")
          .eq("id", "music")
          .maybeSingle();
        const announced = cleanUrl(
          (data as { api_url?: unknown } | null)?.api_url
        );
        const updatedAt = (data as { updated_at?: unknown } | null)?.updated_at;
        const age =
          typeof updatedAt === "string"
            ? now - new Date(updatedAt).getTime()
            : Infinity;
        if (announced && age < MAX_AGE_MS) {
          cachedBase = announced;
          cachedAt = Date.now();
          return announced;
        }
      }
    } catch {
      // Fallback a env.
    }
    const fallback = fallbackBase();
    cachedBase = fallback;
    cachedAt = Date.now();
    return fallback;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function getSoundBaseUrl(): string {
  const raw =
    process.env.SOUND_API_URL ??
    process.env.NEXT_PUBLIC_SOUND_API_URL ??
    "";
  const cleaned = cleanUrl(raw);
  if (!cleaned) {
    throw new Error("Missing SOUND_API_URL server env");
  }
  return cleaned;
}

export function getServerSecret(): string {
  const secret =
    process.env.IGNITE_API_SECRET ??
    process.env.API_SECRET ??
    "";
  if (secret.length < 8) {
    throw new Error("Missing IGNITE_API_SECRET server env");
  }
  return secret;
}
