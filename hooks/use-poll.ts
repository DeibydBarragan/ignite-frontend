"use client";

import { useEffect, useRef } from "react";

export interface UsePollOptions {
  enabled?: boolean;
  intervalMs?: number | (() => number);
  immediate?: boolean;
}

/**
 * Polling inteligente con Page Visibility API, control de concurrencia y cancelación con AbortController.
 */
export function usePoll(
  callback: (signal: AbortSignal) => Promise<void> | void,
  options: UsePollOptions = {}
): void {
  const { enabled = true, intervalMs = 5000, immediate = true } = options;

  const callbackRef = useRef(callback);
  const intervalRef = useRef(intervalMs);

  useEffect(() => {
    callbackRef.current = callback;
    intervalRef.current = intervalMs;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;
    let activeController: AbortController | null = null;

    const executePoll = async () => {
      if (isDisposed || (typeof document !== "undefined" && document.hidden)) {
        return;
      }

      activeController?.abort();
      activeController = new AbortController();

      try {
        await callbackRef.current(activeController.signal);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      } finally {
        if (!isDisposed) {
          scheduleNext();
        }
      }
    };

    const scheduleNext = () => {
      if (isDisposed) return;
      const delay =
        typeof intervalRef.current === "function"
          ? intervalRef.current()
          : intervalRef.current;
      timerId = setTimeout(executePoll, Math.max(500, delay));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerId) clearTimeout(timerId);
        activeController?.abort();
      } else {
        void executePoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (immediate) {
      void executePoll();
    } else {
      scheduleNext();
    }

    return () => {
      isDisposed = true;
      if (timerId) clearTimeout(timerId);
      activeController?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, immediate]);
}
