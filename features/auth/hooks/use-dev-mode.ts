"use client";

import { useEffect, useState, useCallback } from "react";
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

export function useDevMode() {
  const { user } = useAuth();
  const [isDevMode, setIsDevModeState] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const isDevUser = Boolean(user?.id && DEV_USER_IDS.includes(user.id));

  // Load initial local preference
  useEffect(() => {
    if (!isDevUser) {
      setApiDevMode(false);
      setIsDevModeState(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const active = stored === "true";
      setIsDevModeState(active);
      setApiDevMode(active);
    } catch {
      // localStorage unavailable or SSR
    }

    // Sync with bot backend if reachable
    igniteApi
      .getDevMode(user?.id)
      .then((backendActive) => {
        setIsDevModeState(backendActive);
        setApiDevMode(backendActive);
        try {
          localStorage.setItem(STORAGE_KEY, String(backendActive));
        } catch {}
      })
      .catch(() => undefined)
      .finally(() => {
        setIsLoaded(true);
      });
  }, [isDevUser, user?.id]);

  const toggleDevMode = useCallback(async () => {
    if (!isDevUser || !user?.id) return false;

    const nextState = !isDevMode;
    setIsDevModeState(nextState);
    setApiDevMode(nextState);

    try {
      localStorage.setItem(STORAGE_KEY, String(nextState));
    } catch {}

    try {
      await igniteApi.setDevMode(nextState, user.id);
    } catch (err) {
      console.warn("Could not sync dev mode with bot backend:", err);
    }

    return nextState;
  }, [isDevUser, isDevMode, user?.id]);

  return {
    isDevUser,
    isDevMode,
    toggleDevMode,
    isLoaded,
  };
}
