import type { Song } from "@/types/domain";

export type PendingAction =
  | "skip"
  | "previous"
  | "toggle"
  | "play"
  | "playNext"
  | "queue"
  | "clear"
  | "reorder"
  | "stop"
  | null;

export type PendingSongAction = "queue" | "play" | "playNext";

export type PendingSongActions = Record<string, PendingSongAction>;

export interface PlayerQueueTask {
  song: Song;
  mode: "queue" | "playNext";
  resolve: () => void;
  reject: (err: Error) => void;
}

export interface VoiceCheckResult {
  canPlay: boolean;
  reason?: string;
}
