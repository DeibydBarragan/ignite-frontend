import type { Song } from "@/types/domain";

export type MusicSubTab = "radio" | "top" | "favorites" | "playlists";
export type TopSubTab = "week" | "month" | "all";
export type RecommendationsSubTab = TopSubTab | "radio";
export type MusicPlatform = "spotify" | "youtube";

export interface PlaylistLiveState {
  playlistId: string;
  status: "loading" | "ok" | "error";
  tracks: Song[];
  truncated: boolean;
}
