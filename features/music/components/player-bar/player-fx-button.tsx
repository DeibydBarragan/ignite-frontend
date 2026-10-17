"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { usePlaybackControls } from "@/hooks/use-playback-controls";
import { AUDIO_FILTERS, AUDIO_FILTER_LABELS } from "@/lib/audio-filters";
import { SlidersHorizontal, Check } from "lucide-react";

export function PlayerFxButton() {
  const currentFilter = usePlayerStore((s) => s.activeFilter);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { setFilter } = usePlaybackControls();

  const [isFxOpen, setIsFxOpen] = useState(false);
  const [fxCoords, setFxCoords] = useState<{ bottom: number; right: number } | null>(null);
  const fxButtonRef = useRef<HTMLButtonElement>(null);

  const updateFxCoords = useCallback(() => {
    if (!fxButtonRef.current) return;
    const rect = fxButtonRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    setFxCoords({
      bottom: vh - rect.top + 8,
      right: Math.max(8, vw - rect.right),
    });
  }, []);

  const toggleFx = () => {
    if (!isFxOpen) {
      updateFxCoords();
      setIsFxOpen(true);
    } else {
      setIsFxOpen(false);
    }
  };

  useEffect(() => {
    if (!isFxOpen) return;
    const handleScrollOrResize = () => updateFxCoords();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isFxOpen, updateFxCoords]);

  return (
    <div className="relative">
      <button
        ref={fxButtonRef}
        onClick={toggleFx}
        disabled={isPlayerBusy}
        title={currentFilter ? `Filtro: ${AUDIO_FILTER_LABELS[currentFilter as keyof typeof AUDIO_FILTER_LABELS] ?? currentFilter}` : "Efectos de audio (8D, bassboost...)"}
        className={`glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
          currentFilter
            ? "text-purple-600 dark:text-purple-400 border-purple-500/40 bg-purple-500/10"
            : "text-slate-700 dark:text-slate-200 hover:border-purple-500/30"
        }`}
      >
        <SlidersHorizontal size={14} />
        <span className="hidden lg:inline">{currentFilter ? (AUDIO_FILTER_LABELS[currentFilter as keyof typeof AUDIO_FILTER_LABELS] ?? currentFilter) : "FX"}</span>
      </button>

      {isFxOpen && fxCoords && typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[10000]" onClick={() => setIsFxOpen(false)} aria-hidden="true" />
            <div
              style={{
                position: "fixed",
                bottom: `${fxCoords.bottom}px`,
                right: `${fxCoords.right}px`,
              }}
              className="glass-dropdown w-48 p-1.5 z-[10001] bg-white/60 dark:bg-[#12151f]/65 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar glass-modal-enter space-y-0.5"
            >
              <button
                onClick={() => {
                  setFilter("none");
                  setIsFxOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  !currentFilter
                    ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span>Sin filtro</span>
                {!currentFilter && <Check size={13} className="text-purple-500" />}
              </button>
              {AUDIO_FILTERS.map((name) => {
                const isActive = currentFilter === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setFilter(name);
                      setIsFxOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{AUDIO_FILTER_LABELS[name]}</span>
                    {isActive && <Check size={13} className="text-purple-500" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
