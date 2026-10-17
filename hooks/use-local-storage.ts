"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

function parseStored(raw: string | null): unknown {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function useLocalStorage<T>(
  key: string,
  initial: T,
  schema: z.ZodType<T>
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const parsed = parseStored(window.localStorage.getItem(key));
      const result = schema.safeParse(parsed);
      return result.success ? result.data : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // QuotaExceededError: mantener estado en memoria.
        }
        return resolved;
      });
    },
    [key]
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const parsed = parseStored(e.newValue);
        if (parsed === undefined) {
          setValue(initial);
          return;
        }
        const result = schema.safeParse(parsed);
        if (result.success) setValue(result.data);
      } catch {
        // Ignorar payload corrupto de otra pestaña.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set];
}
