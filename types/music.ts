import type { Song } from "@/types/domain";

export type MusicSubTab = "radio" | "favorites" | "top" | "playlists";
/** Dónde busca el buscador: en todo, solo en tus favoritas o solo en YouTube. */
export type SearchScope = "all" | "favorites" | "youtube";
export type TopSubTab = "week" | "month" | "all";
export type RecommendationsSubTab = TopSubTab | "radio";
export type MusicPlatform = "spotify" | "youtube";

export interface PlaylistLiveState {
  playlistId: string;
  status: "loading" | "ok" | "error";
  tracks: Song[];
  truncated: boolean;
}
