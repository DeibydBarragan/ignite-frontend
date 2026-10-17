"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LiveEvent } from "@/types/domain";

export type LiveEventInput = Pick<LiveEvent, "type" | "title" | "description">;

interface LiveEventsContextValue {
  liveEvents: LiveEvent[];
  addLiveEvent: (event: LiveEventInput) => void;
  clearLiveEvents: () => void;
}

const LiveEventsContext = createContext<LiveEventsContextValue | null>(null);

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  const addLiveEvent = useCallback((event: LiveEventInput) => {
    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: event.type,
        title: event.title,
        description: event.description,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const clearLiveEvents = useCallback(() => {
    setLiveEvents([]);
  }, []);

  const value = useMemo(
    () => ({ liveEvents, addLiveEvent, clearLiveEvents }),
    [liveEvents, addLiveEvent, clearLiveEvents]
  );

  return <LiveEventsContext.Provider value={value}>{children}</LiveEventsContext.Provider>;
}

export function useLiveEvents(): LiveEventsContextValue {
  const ctx = useContext(LiveEventsContext);
  if (!ctx) throw new Error("useLiveEvents must be used within a LiveEventsProvider");
  return ctx;
}
