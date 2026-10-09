"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Flame } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
        return;
      }

      // 2. Listen for the auth event when code/hash is processed by supabase-js
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || session) {
          subscription.unsubscribe();
          router.replace("/");
        }
      });

      // 3. Fallback timeout in case auth failed or was cancelled
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/");
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0c] text-white">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center animate-pulse">
          <Flame size={32} className="text-purple-400" />
        </div>
        <Loader2 size={44} className="animate-spin text-purple-500 absolute" />
      </div>
      <p className="mt-4 text-xs font-mono text-slate-400">
        Completando inicio de sesión con Discord...
      </p>
    </div>
  );
}
