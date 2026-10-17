import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Singleton para componentes cliente (compatibilidad durante Fase 1).
// En Fase 2 migrar a createClient() por llamada.
import { createBrowserClient as createBrowser } from "@supabase/ssr";
let browserSingleton: ReturnType<typeof createBrowser> | null = null;

export function getBrowserSupabase() {
  if (typeof window === "undefined") {
    return createClient();
  }
  if (!browserSingleton) {
    browserSingleton = createClient();
  }
  return browserSingleton;
}

export const supabase = getBrowserSupabase();
