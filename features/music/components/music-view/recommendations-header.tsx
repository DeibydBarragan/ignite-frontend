"use client";

import type { Song } from "@/types/domain";
import type { TopSubTab } from "@/types/music";
import { CoverImage } from "@/components/ui/cover-image";
import { Flame, Trophy, CalendarDays, RefreshCw, Play, Radio } from "lucide-react";

export interface TopSongsHeaderProps {
  topSubTab: TopSubTab;
  onTopSubTabChange: (tab: TopSubTab) => void;
  isLoadingTop: boolean;
  topSongsCount: number;
  isPlayerBusy: boolean;
  onRefresh: () => void;
  onPlayAll: () => void;
}

export function TopSongsHeader({
  topSubTab,
  onTopSubTabChange,
  isLoadingTop,
  topSongsCount,
  isPlayerBusy,
  onRefresh,
  onPlayAll,
}: TopSongsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-1.5 rounded-2xl glass-panel">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full min-w-0">
        <button
          type="button"
          onClick={() => onTopSubTabChange("week")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            topSubTab === "week"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Flame size={12} className="text-amber-400" />
          <span>Top Semanal</span>
        </button>

        <button
          type="button"
          onClick={() => onTopSubTabChange("month")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            topSubTab === "month"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <CalendarDays size={12} className="text-sky-400" />
          <span>Top Mensual</span>
        </button>

        <button
          type="button"
          onClick={() => onTopSubTabChange("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            topSubTab === "all"
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
          type="button"
          onClick={onRefresh}
          disabled={isLoadingTop}
          title="Refrescar ranking"
          className="glass-btn p-1.5 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 cursor-pointer rounded-lg"
        >
          <RefreshCw size={13} className={isLoadingTop ? "animate-spin text-purple-400" : ""} />
        </button>

        {topSongsCount > 0 && (
          <button
            type="button"
            onClick={onPlayAll}
            disabled={isPlayerBusy}
            className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-[#1ed760] border-[#1db954]/30 hover:bg-[#1db954]/10 cursor-pointer disabled:opacity-50 font-semibold"
          >
            <Play size={11} className="fill-current" />
            <span>Reproducir todo el Top</span>
          </button>
        )}
      </div>
    </div>
  );
}

export interface RadioHeaderProps {
  basedOnSong: Song | null;
  isLoadingRadio: boolean;
  radioSongsCount: number;
  isPlayerBusy: boolean;
  onRefresh: () => void;
  onPlayAll: () => void;
}

export function RadioHeader({
  basedOnSong,
  isLoadingRadio,
  radioSongsCount,
  isPlayerBusy,
  onRefresh,
  onPlayAll,
}: RadioHeaderProps) {
  return (
    <div className="p-3 rounded-2xl glass-panel border border-purple-500/25 bg-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {basedOnSong ? (
          <>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/20 shadow-xs">
              <CoverImage src={basedOnSong.albumArt} alt={basedOnSong.title} sizes="40px" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Radio en vivo generada a partir de
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {basedOnSong.title}{" "}
                <span className="font-normal text-slate-500 dark:text-slate-400">— {basedOnSong.artist}</span>
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Radio size={16} className="text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Radio en vivo</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Música contextual generada en tiempo real según lo que suena en Discord
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoadingRadio}
          title="Sintonizar de nuevo"
          className="glass-btn p-1.5 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 cursor-pointer rounded-lg"
        >
          <RefreshCw size={13} className={isLoadingRadio ? "animate-spin text-purple-400" : ""} />
        </button>

        {radioSongsCount > 0 && (
          <button
            type="button"
            onClick={onPlayAll}
            disabled={isPlayerBusy}
            className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-[#1ed760] border-[#1db954]/30 hover:bg-[#1db954]/10 cursor-pointer disabled:opacity-50 font-semibold"
          >
            <Play size={11} className="fill-current" />
            <span>Reproducir Radio</span>
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
          <CoverImage src={song.albumArt} alt={song.title} sizes="40px" className="w-full h-full" />
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
