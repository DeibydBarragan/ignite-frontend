"use client";

import { useState } from "react";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { usePlaybackControls } from "@/hooks/use-playback-controls";
import { useFavorites } from "@/context/favorites-context";
import dynamic from "next/dynamic";
import { PlayerCollapsedBar } from "./player-collapsed-bar";
import { PlayerTrackInfo } from "./player-track-info";
import { PlayerTransport } from "./player-transport";
import { PlayerFxButton } from "./player-fx-button";
import { ListPlus, Loader2, Square, ListMusic, Minimize2 } from "lucide-react";

const QueueDrawer = dynamic(
  () => import("../queue-drawer/queue-drawer").then((m) => m.QueueDrawer),
  { ssr: false }
);

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const autoplay = usePlayerStore((s) => s.autoplay);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);
  const isPlayerCollapsed = usePlayerStore((s) => s.isPlayerCollapsed);
  const setIsPlayerCollapsed = usePlayerStore((s) => s.setIsPlayerCollapsed);
  const queueLength = useQueueStore((s) => s.queue.length);
  const { toggleAutoplay, stopPlayback } = usePlaybackControls();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id) || isFavorite(currentSong.url);

  return (
    <>
      {isPlayerCollapsed ? (
        <PlayerCollapsedBar />
      ) : (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-7xl mx-auto">
          <div className="glass-panel player-glass-dock p-3 sm:py-2.5 sm:px-4 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
              {/* Left: Song Info */}
              <PlayerTrackInfo
                song={currentSong}
                isFav={isFav}
                onToggleFavorite={toggleFavorite}
                onCollapse={() => setIsPlayerCollapsed(true)}
              />

              {/* Center: Controls + Time Scrubber */}
              <PlayerTransport />

              {/* Right: FX, Autoplay, Stop, Queue */}
              <div className="flex items-center justify-end gap-2 w-full md:w-1/4 flex-wrap">
                {/* FX / Filtros de audio */}
                <PlayerFxButton />

                {/* Autoplay */}
                <button
                  onClick={toggleAutoplay}
                  disabled={isPlayerBusy}
                  title={autoplay ? "Autoplay activado" : "Autoplay desactivado"}
                  className={`glass-btn p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                    autoplay
                      ? "text-[#1ed760] bg-[#1db954]/15"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <ListPlus size={15} />
                </button>

                {/* Stop */}
                <button
                  onClick={stopPlayback}
                  disabled={isPlayerBusy}
                  title="Detener y salir del canal de voz"
                  className="glass-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {pendingAction === "stop" ? (
                    <Loader2 size={14} className="animate-spin text-rose-400" />
                  ) : (
                    <Square size={14} className="fill-current" />
                  )}
                </button>

                <button
                  onClick={() => setIsQueueOpen(true)}
                  className="glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:border-purple-500/30 cursor-pointer"
                >
                  <ListMusic size={15} />
                  <span>Cola</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-600/20 text-purple-400 font-bold text-[10px] border border-purple-500/30">
                    {queueLength}
                  </span>
                </button>

                {/* Contraer a la esquina (Desktop) */}
                <button
                  type="button"
                  onClick={() => setIsPlayerCollapsed(true)}
                  title="Contraer reproductor a la esquina"
                  className="glass-btn p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:border-purple-500/30 transition-colors cursor-pointer hidden md:flex items-center justify-center"
                  aria-label="Contraer reproductor a la esquina"
                >
                  <Minimize2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isQueueOpen && (
        <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      )}
    </>
  );
}
