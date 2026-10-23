"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import { useAuth } from "@/context/auth-context";
import { igniteApi } from "@/lib/ignite-api";
import { setApiDevMode } from "@/lib/http";

const DEV_USER_IDS = (
  process.env.NEXT_PUBLIC_DEV_USER_IDS || "472144161357824000"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const STORAGE_KEY = "ignite_dev_mode_active";

interface DevModeStore {
  isDevMode: boolean;
  isLoaded: boolean;
  setDevMode: (val: boolean) => void;
  setLoaded: (val: boolean) => void;
}

export const useDevModeStore = create<DevModeStore>((set) => ({
  isDevMode: false,
  isLoaded: false,
  setDevMode: (val) => {
    set({ isDevMode: val });
    setApiDevMode(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(val));
      } catch {}
    }
  },
  setLoaded: (val) => set({ isLoaded: val }),
}));

export function useDevMode() {
  const { user } = useAuth();
  const isDevMode = useDevModeStore((s) => s.isDevMode);
  const isLoaded = useDevModeStore((s) => s.isLoaded);
  const setDevMode = useDevModeStore((s) => s.setDevMode);
  const setLoaded = useDevModeStore((s) => s.setLoaded);

  const isDevUser = Boolean(user?.id && DEV_USER_IDS.includes(user.id));

  // Load initial local preference and sync with bot backend
  useEffect(() => {
    if (!isDevUser) {
      if (isDevMode) setDevMode(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const active = stored === "true";
        setDevMode(active);
      }
    } catch {
      // localStorage unavailable or SSR
    }

    // Sync with bot backend if reachable
    igniteApi
      .getDevMode(user?.id)
      .then((backendActive) => {
        setDevMode(backendActive);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoaded(true);
      });
  }, [isDevUser, user?.id, setDevMode, setLoaded]);

  const toggleDevMode = useCallback(async () => {
    if (!isDevUser || !user?.id) return false;

    const nextState = !isDevMode;
    setDevMode(nextState);

    try {
      await igniteApi.setDevMode(nextState, user.id);
    } catch (err) {
      console.warn("Could not sync dev mode with bot backend:", err);
    }

    return nextState;
  }, [isDevUser, isDevMode, user?.id, setDevMode]);

  return {
    isDevUser,
    isDevMode,
    toggleDevMode,
    isLoaded,
  };
}
