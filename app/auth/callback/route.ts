import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("Error exchanging code for session:", err);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
