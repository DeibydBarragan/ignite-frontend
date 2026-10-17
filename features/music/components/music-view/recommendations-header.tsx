"use client";

import type { Song } from "@/types/domain";
import type { RecommendationsSubTab } from "@/types/music";
import { CoverImage } from "@/components/ui/cover-image";
import { Radio, Flame, Trophy, CalendarDays, RefreshCw, Play } from "lucide-react";

export interface RecommendationsHeaderProps {
  recSubTab: RecommendationsSubTab;
  onRecSubTabChange: (tab: RecommendationsSubTab) => void;
  currentSong: Song | null;
  isLoadingRecs: boolean;
  recSongsCount: number;
  isPlayerBusy: boolean;
  onRefresh: () => void;
  onPlayAll: () => void;
}

export function RecommendationsHeader({
  recSubTab,
  onRecSubTabChange,
  currentSong,
  isLoadingRecs,
  recSongsCount,
  isPlayerBusy,
  onRefresh,
  onPlayAll,
}: RecommendationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-1.5 rounded-2xl glass-panel">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full min-w-0">
        <button
          onClick={() => onRecSubTabChange("radio")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            recSubTab === "radio"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Radio size={12} className={currentSong ? "text-emerald-300 animate-pulse" : ""} />
          <span>Radio en vivo</span>
          {currentSong && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
        </button>

        <button
          onClick={() => onRecSubTabChange("week")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            recSubTab === "week"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Flame size={12} className="text-amber-400" />
          <span>Top Semanal</span>
        </button>

        <button
          onClick={() => onRecSubTabChange("month")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            recSubTab === "month"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <CalendarDays size={12} className="text-sky-400" />
          <span>Top Mensual</span>
        </button>

        <button
          onClick={() => onRecSubTabChange("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            recSubTab === "all"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Trophy size={12} className="text-amber-400" />
          <span>De siempre</span>
        </button>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={onRefresh}
          disabled={isLoadingRecs}
          title="Refrescar recomendaciones"
          className="glass-btn p-1.5 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 cursor-pointer rounded-lg"
        >
          <RefreshCw size={13} className={isLoadingRecs ? "animate-spin text-purple-400" : ""} />
        </button>

        {recSongsCount > 0 && (
          <button
            onClick={onPlayAll}
            disabled={isPlayerBusy}
            className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-[#1ed760] border-[#1db954]/30 hover:bg-[#1db954]/10 cursor-pointer disabled:opacity-50 font-semibold"
          >
            <Play size={11} className="fill-current" />
            <span>
              {recSubTab === "radio" ? "Reproducir Radio" : "Reproducir todo el Top"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function BasedOnBanner({ song }: { song: Song }) {
  return (
    <div className="p-3 rounded-2xl glass-panel border border-purple-500/25 bg-purple-500/5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/20 shadow-xs">
          <CoverImage src={song.albumArt} alt={song.title} className="w-full h-full" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Radio en vivo generada a partir de
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {song.title}{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">— {song.artist}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
