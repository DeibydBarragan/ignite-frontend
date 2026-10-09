import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qzedjwrpvcgmfqgsvxyi.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZWRqd3JwdmNnbWZxZ3N2eHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzI3MDAsImV4cCI6MjEwNjYwODcwMH0.0XJ6R25ZXcS31Et6ugu-dCWSh0JsJeAIKiKh1XGuEIg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
