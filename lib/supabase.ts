// Shim de compatibilidad — Fase 0.3.
// No contiene secretos hardcodeados. Lee desde lib/env.ts (validado con Zod).
// Código nuevo: importar desde "@/lib/supabase/client" o "@/lib/supabase/server".
export { supabase, getBrowserSupabase, createClient } from "@/lib/supabase/client";
