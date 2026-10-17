"use client";

import { useCallback, useState } from "react";
import { STORAGE_KEYS, migrateLegacyKeys } from "@/lib/storage-keys";

export function usePlayerCollapsed(): [
  boolean,
  (val: boolean | ((prev: boolean) => boolean)) => void,
] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      migrateLegacyKeys();
      return localStorage.getItem(STORAGE_KEYS.playerCollapsed) === "true";
    } catch {
      return false;
    }
  });

  const setCollapsedPersisted = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCollapsed((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem(STORAGE_KEYS.playerCollapsed, String(next));
      } catch {
        // QuotaExceededError: mantener estado en memoria.
      }
      return next;
    });
  }, []);

  return [collapsed, setCollapsedPersisted];
}
