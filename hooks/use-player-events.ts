"use client";

import { useEffect, useRef, useState } from "react";
import { musicUrl } from "@/lib/ignite-api";

interface UsePlayerEventsOptions {
  enabled: boolean;
  guildId: string | null | undefined;
  onSync: () => void;
}

/**
 * Suscribe el estado del player al stream SSE del bot (`player.sync`).
 * EventSource reconecta solo; `isLive` indica si hay stream activo para
 * degradar el polling a una reconciliación lenta.
 */
export function usePlayerEvents({ enabled, guildId, onSync }: UsePlayerEventsOptions): {
  isLive: boolean;
} {
  const [isLive, setIsLive] = useState(false);
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled || !guildId || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource(musicUrl(`guilds/${encodeURIComponent(guildId)}/events`));
    const handleSync = () => onSyncRef.current();

    source.addEventListener("open", () => setIsLive(true));
    source.addEventListener("error", () => setIsLive(false));
    source.addEventListener("player.sync", handleSync);

    return () => {
      source.removeEventListener("player.sync", handleSync);
      source.close();
      setIsLive(false);
    };
  }, [enabled, guildId]);

  return { isLive };
}
