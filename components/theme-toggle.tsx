"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { STORAGE_KEYS } from "@/lib/storage-keys";

type Theme = "light" | "dark";

const themeListeners = new Set<() => void>();

function emitTheme() {
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle() {
  const mounted = useMounted();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      (!(STORAGE_KEYS.theme in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    emitTheme();
  }, []);

  function toggle() {
    const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      // storage bloqueado
    }
    emitTheme();
  }

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 opacity-50" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      onPress={toggle}
      aria-label="Alternar tema"
      className="glass-btn flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    >
      {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
    </Button>
  );
}
