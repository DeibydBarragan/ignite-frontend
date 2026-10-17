"use client";

import type { MusicSubTab } from "@/types/music";
import { Radio, Flame, Star, ListMusic, Play } from "lucide-react";

export interface MusicCatalogTabsProps {
  activeTab: MusicSubTab;
  onTabChange: (tab: MusicSubTab) => void;
  favoritesCount: number;
  radioSongsCount: number;
  topSongsCount: number;
  hasActiveRadio: boolean;
  isPlayerBusy: boolean;
  onPlayFavorites: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function MusicCatalogTabs({
  activeTab,
  onTabChange,
  favoritesCount,
  radioSongsCount,
  topSongsCount,
  hasActiveRadio,
  isPlayerBusy,
  onPlayFavorites,
  scrollRef,
}: MusicCatalogTabsProps) {
  return (
    <div
      ref={scrollRef}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 min-w-0 scroll-mt-20"
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full min-w-0 pb-0.5">
        {/* Pestaña Principal: Radio en vivo */}
        <button
          type="button"
          onClick={() => onTabChange("radio")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === "radio"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio
            size={13}
            className={
              hasActiveRadio
                ? "text-emerald-400 animate-pulse"
                : activeTab === "radio"
                ? "text-purple-400"
                : ""
            }
          />
          <span>Radio en vivo</span>
          {hasActiveRadio && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          )}
          {radioSongsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-400 font-mono">
              {radioSongsCount}
            </span>
          )}
        </button>

        {/* Pestaña: Mis Favoritos (segunda pestaña) */}
        <button
          type="button"
          onClick={() => onTabChange("favorites")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === "favorites"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Star
            size={13}
            className={
              activeTab === "favorites" ? "fill-amber-400 text-amber-400" : ""
            }
          />
          <span>Mis Favoritos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/15 text-amber-400 font-mono font-bold">
            {favoritesCount}
          </span>
        </button>

        {/* Pestaña: Top Canciones */}
        <button
          type="button"
          onClick={() => onTabChange("top")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === "top"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame
            size={13}
            className={activeTab === "top" ? "text-amber-400" : ""}
          />
          <span>Top Canciones</span>
          {topSongsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/15 text-amber-400 font-mono">
              {topSongsCount}
            </span>
          )}
        </button>

        {/* Pestaña: Playlists */}
        <button
          type="button"
          onClick={() => onTabChange("playlists")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === "playlists"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ListMusic
            size={13}
            className={activeTab === "playlists" ? "text-emerald-400" : ""}
          />
          <span>Playlists</span>
        </button>
      </div>

      {/* Botón de acción: Reproducir todos mis favoritos */}
      {activeTab === "favorites" && favoritesCount > 0 && (
        <button
          type="button"
          onClick={onPlayFavorites}
          disabled={isPlayerBusy}
          className="glass-btn px-3 py-1 text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer disabled:opacity-50"
        >
          <Play size={12} className="fill-current" />
          <span>Reproducir todos mis favoritos</span>
        </button>
      )}
    </div>
  );
}
