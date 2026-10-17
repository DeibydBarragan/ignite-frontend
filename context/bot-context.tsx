"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { LiveEventsProvider } from "@/context/live-events-context";
import { SoundboardProvider } from "@/context/soundboard-context";
import { TTSProvider } from "@/context/tts-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { usePlayerSync } from "@/hooks/use-player-sync";

function PlayerSyncManager() {
  usePlayerSync();
  return null;
}

export function BotProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LiveEventsProvider>
        <SoundboardProvider>
          <TTSProvider>
            <FavoritesProvider>
              <PlayerSyncManager />
              {children}
            </FavoritesProvider>
          </TTSProvider>
        </SoundboardProvider>
      </LiveEventsProvider>
    </AuthProvider>
  );
}
