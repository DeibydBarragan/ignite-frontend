"use client";

import { useBot } from "@/context/bot-context";
import { GlassModal } from "@/components/glass-modal";
import { Button } from "@heroui/react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Song } from "@/lib/mock-data";
import { ListMusic, Trash2, X, Music, Play, Disc3, Loader2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function SortableQueueItem({
  id,
  song,
  index,
  isLast,
  disabled,
  removing,
  onMove,
  onJump,
  onRemove,
}: {
  id: string;
  song: Song;
  index: number;
  isLast: boolean;
  disabled: boolean;
  removing: boolean;
  onMove: (from: number, to: number) => void;
  onJump: (index: number) => void;
  onRemove: (songId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 p-2 rounded-xl transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5 bg-white dark:bg-transparent ${
        isDragging
          ? "opacity-40 border-purple-500/40 bg-purple-500/5 shadow-lg z-10"
          : "hover:bg-black/5 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          {...attributes}
          {...listeners}
          title="Arrastra para reordenar"
          className={`p-1 -ml-1 rounded shrink-0 ${
            disabled
              ? "opacity-30 cursor-not-allowed touch-auto"
              : "cursor-grab active:cursor-grabbing touch-none text-slate-300 dark:text-slate-600 hover:text-purple-400"
          }`}
        >
          <GripVertical size={14} />
        </span>
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

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] font-mono text-slate-400 mr-1">
          {formatDuration(song.duration)}
        </span>
        <button
          onClick={() => onMove(index, index - 1)}
          disabled={disabled || index === 0}
          title="Subir en la cola"
          className={`p-1 rounded-lg transition-colors ${
            disabled || index === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 cursor-pointer"
          }`}
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={() => onMove(index, index + 1)}
          disabled={disabled || isLast}
          title="Bajar en la cola"
          className={`p-1 rounded-lg transition-colors ${
            disabled || isLast
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 cursor-pointer"
          }`}
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={() => onJump(index)}
          disabled={disabled}
          title="Saltar a este tema ahora"
          className={`p-1 rounded-lg transition-colors ${
            disabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 cursor-pointer"
          }`}
        >
          <Play size={13} />
        </button>
        <button
          onClick={() => onRemove(song.id)}
          disabled={disabled || removing}
          title="Eliminar de la cola"
          className={`p-1 rounded-lg transition-colors ${
            removing || disabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 cursor-pointer"
          }`}
        >
          {removing ? (
            <Loader2 size={13} className="animate-spin text-rose-400" />
          ) : (
            <X size={13} />
          )}
        </button>
      </div>
    </div>
  );
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
    moveQueueSong,
    jumpToQueueSong,
    removeFromQueue,
    clearQueue,
    isPlayerBusy,
    pendingAction,
    removingSongId,
  } = useBot();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    if (from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
    moveQueueSong(from, to);
  };

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
            isDisabled={queue.length === 0 || isPlayerBusy}
            className="flex items-center gap-1.5"
          >
            {pendingAction === "clear" ? (
              <>
                <Loader2 size={13} className="animate-spin text-rose-400" />
                <span>Vaciando...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Vaciar cola</span>
              </>
            )}
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
            {queue.length > 1 && !isPlayerBusy && (
              <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1">
                <GripVertical size={11} />
                Arrastra para reordenar
              </span>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl">
              <Music size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                La cola está vacía
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Añade temas desde el catálogo musical o pega un enlace de YouTube o Spotify.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={queue.map((_, index) => String(index))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {queue.map((song, index) => (
                    <SortableQueueItem
                      key={song.id + "-" + index}
                      id={String(index)}
                      song={song}
                      index={index}
                      isLast={index === queue.length - 1}
                      disabled={isPlayerBusy}
                      removing={removingSongId === song.id}
                      onMove={moveQueueSong}
                      onJump={jumpToQueueSong}
                      onRemove={removeFromQueue}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
