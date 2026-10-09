"use client";

import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { Button } from "@heroui/react";
import { ListMusic, Trash2, X, Music, Play, Disc3, Clock } from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function QueueDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    playSong,
    removeFromQueue,
    clearQueue,
  } = useBot();

  const totalSeconds = (currentSong ? currentSong.duration - currentTime : 0) +
    queue.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      icon={<ListMusic size={20} />}
      title="Cola de Reproducción"
      subtitle={`${queue.length} temas en espera — Duración aproximada: ~${formatDuration(totalSeconds)}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger-soft"
            size="sm"
            onPress={clearQueue}
            isDisabled={queue.length === 0}
            className="flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Vaciar cola</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={onClose}
            className="font-medium"
          >
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current Song Section */}
        {currentSong && (
          <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] dark:bg-purple-950/20">
            <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Disc3 size={13} className={isPlaying ? "animate-spin" : ""} />
                Reproduciendo ahora
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatDuration(currentTime)} / {formatDuration(currentSong.duration)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentSong.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentSong.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Queued Songs List */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>A continuación ({queue.length})</span>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl">
              <Music size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                La cola está vacía
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Añade temas desde el catálogo musical o pega un enlace de YouTube, Spotify o SoundCloud.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {queue.map((song, index) => (
                <div
                  key={song.id + "-" + index}
                  className="group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 w-5 text-center">
                      #{index + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.albumArt}
                      alt={song.title}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={() => {
                        playSong(song);
                        removeFromQueue(song.id);
                      }}
                      title="Saltar a este tema ahora"
                      className="p-1 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      onClick={() => removeFromQueue(song.id)}
                      title="Eliminar de la cola"
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
