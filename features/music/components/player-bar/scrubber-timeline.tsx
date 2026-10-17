"use client";

import { usePlayerStore } from "@/features/music/stores/player-store";
import { formatDuration } from "@/lib/formatters";

export interface ScrubberTimelineProps {
  onSeek: (seconds: number) => void;
}

export function ScrubberTimeline({ onSeek }: ScrubberTimelineProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.currentSong?.duration || 180);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className="w-full flex items-center gap-2.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
      <span className="w-9 text-right font-medium">
        {formatDuration(currentTime)}
      </span>

      <div className="relative flex-1 group flex items-center">
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          disabled={isPlayerBusy}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Progreso de la pista"
          className={`w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-[#1db954] focus:outline-none ${
            isPlayerBusy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          style={{
            background: `linear-gradient(to right, #1db954 ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)`,
          }}
        />
      </div>

      <span className="w-9 text-left font-medium">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
