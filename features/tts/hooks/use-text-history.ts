"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export class TextHistoryManager {
  private history: string[];
  private currentIndex: number;
  private maxHistory: number;

  constructor(initialValue: string = "", maxHistory = 50) {
    this.history = [initialValue];
    this.currentIndex = 0;
    this.maxHistory = maxHistory;
  }

  get current(): string {
    return this.history[this.currentIndex] ?? "";
  }

  get canUndo(): boolean {
    return this.currentIndex > 0;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  get allHistory(): readonly string[] {
    return this.history;
  }

  get index(): number {
    return this.currentIndex;
  }

  commit(newVal: string): boolean {
    const truncated = this.history.slice(0, this.currentIndex + 1);
    if (truncated[truncated.length - 1] === newVal) {
      return false;
    }
    truncated.push(newVal);
    if (truncated.length > this.maxHistory) {
      truncated.shift();
    }
    this.history = truncated;
    this.currentIndex = this.history.length - 1;
    return true;
  }

  undo(uncommittedText?: string): string | null {
    if (uncommittedText !== undefined && uncommittedText !== this.current) {
      this.commit(uncommittedText);
    }
    if (!this.canUndo) return null;
    this.currentIndex -= 1;
    return this.current;
  }

  redo(): string | null {
    if (!this.canRedo) return null;
    this.currentIndex += 1;
    return this.current;
  }

  reset(newVal = ""): void {
    this.history = [newVal];
    this.currentIndex = 0;
  }
}

export interface UseTextHistoryOptions {
  maxHistory?: number;
  debounceMs?: number;
}

export interface UseTextHistoryReturn {
  text: string;
  setText: (value: string, immediate?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  reset: (newText?: string) => void;
}

/**
 * Hook para gestionar el historial de deshacer/rehacer de texto con soporte para:
 * - Escritura agrupada por debounce
 * - Checkpoints inmediatos (al emitir, cargar frase o limpiar)
 * - Atajos de teclado Ctrl+Z / Cmd+Z y Ctrl+Y / Ctrl+Shift+Z
 */
export function useTextHistory(
  initialValue: string = "",
  options: UseTextHistoryOptions = {}
): UseTextHistoryReturn {
  const { maxHistory = 50, debounceMs = 350 } = options;

  const managerRef = useRef<TextHistoryManager>(new TextHistoryManager(initialValue, maxHistory));
  const [text, setTextState] = useState(initialValue);
  const [historyVersion, setHistoryVersion] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerUpdate = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  const setText = useCallback(
    (value: string, immediate = false) => {
      setTextState(value);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (immediate) {
        managerRef.current.commit(value);
        triggerUpdate();
      } else {
        timerRef.current = setTimeout(() => {
          managerRef.current.commit(value);
          triggerUpdate();
          timerRef.current = null;
        }, debounceMs);
      }
    },
    [debounceMs, triggerUpdate]
  );

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const target = managerRef.current.undo(text);
    if (target !== null) {
      setTextState(target);
      triggerUpdate();
    }
  }, [text, triggerUpdate]);

  const redo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const target = managerRef.current.redo();
    if (target !== null) {
      setTextState(target);
      triggerUpdate();
    }
  }, [triggerUpdate]);

  const reset = useCallback(
    (newText = "") => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      managerRef.current.reset(newText);
      setTextState(newText);
      triggerUpdate();
    },
    [triggerUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo]
  );

  const canUndo =
    managerRef.current.canUndo ||
    (text !== managerRef.current.current && managerRef.current.current !== "");
  const canRedo = managerRef.current.canRedo;

  return {
    text,
    setText,
    undo,
    redo,
    canUndo,
    canRedo,
    handleKeyDown,
    reset,
  };
}
