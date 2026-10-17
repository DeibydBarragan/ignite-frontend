// Registro único y versionado de claves de localStorage.
// Prefijo ignite_v2_* — las claves legacy sin versión se migran bajo demanda.

export const STORAGE_KEYS = {
  soundScopes: "ignite_v2_sound_scopes",
  soundRecentPlayed: "ignite_v2_sound_recent_played",
  playerCollapsed: "ignite_v2_player_collapsed",
  activeTab: "ignite_v2_active_tab",
  musicSubtab: "ignite_v2_music_subtab",
  musicRecSubtab: "ignite_v2_music_rec_subtab",
  userPlaylists: "ignite_v2_user_playlists",
  savedPhrases: "ignite_v2_saved_phrases",
  theme: "theme",
  favPlaylistsPrefix: "ignite_v2_fav_playlists_",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Claves legacy (sin versión) para migración automática una sola vez.
const LEGACY_MAP: Record<string, string> = {
  ignite_sound_scopes: STORAGE_KEYS.soundScopes,
  ignite_sound_recent_played: STORAGE_KEYS.soundRecentPlayed,
  ignite_player_collapsed: STORAGE_KEYS.playerCollapsed,
  ignite_active_tab: STORAGE_KEYS.activeTab,
  ignite_music_subtab: STORAGE_KEYS.musicSubtab,
  ignite_music_rec_subtab: STORAGE_KEYS.musicRecSubtab,
  ignite_user_playlists: STORAGE_KEYS.userPlaylists,
  ignite_saved_phrases: STORAGE_KEYS.savedPhrases,
};

export function migrateLegacyKeys(): void {
  if (typeof window === "undefined") return;
  try {
    for (const [legacy, next] of Object.entries(LEGACY_MAP)) {
      if (window.localStorage.getItem(next) != null) continue;
      const raw = window.localStorage.getItem(legacy);
      if (raw != null) {
        window.localStorage.setItem(next, raw);
      }
    }
  } catch {
    // QuotaExceededError u otros: no bloquear el arranque.
  }
}

export function favPlaylistsKey(userId: string | null | undefined): string {
  return `${STORAGE_KEYS.favPlaylistsPrefix}${userId ?? "guest"}`;
}
