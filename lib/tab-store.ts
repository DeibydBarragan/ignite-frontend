import { STORAGE_KEYS, migrateLegacyKeys } from "@/lib/storage-keys";

const TABS = ["music", "soundboard", "tts", "voice"] as const;

export type StoredTab = (typeof TABS)[number];

export function isValidTab(val: unknown): val is StoredTab {
  return typeof val === "string" && (TABS as readonly string[]).includes(val);
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeTab(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("hashchange", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("hashchange", callback);
  };
}

export function getTabSnapshot(): StoredTab {
  try {
    migrateLegacyKeys();
  } catch {
    // storage bloqueado: continuar sin migración.
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (isValidTab(hash)) return hash;
  try {
    const searchTab = new URLSearchParams(window.location.search).get("tab");
    if (isValidTab(searchTab)) return searchTab;
    const saved = window.localStorage.getItem(STORAGE_KEYS.activeTab);
    if (isValidTab(saved)) return saved;
  } catch {
    // URL o storage inaccesibles: usar default.
  }
  return "music";
}

export function getServerTabSnapshot(): StoredTab {
  return "music";
}

export function setActiveTab(tab: StoredTab): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, tab);
  } catch {
    // storage bloqueado.
  }
  window.history.replaceState(null, "", `#${tab}`);
  emit();
}

export function normalizeTabUrl(tab: StoredTab): void {
  window.history.replaceState(null, "", `#${tab}`);
}
