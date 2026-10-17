"use client";

import { useState } from "react";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useQueueEditing } from "@/hooks/use-queue-editing";
import { useFavorites } from "@/context/favorites-context";
import { GlassModal } from "@/components/ui/glass-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { formatDuration } from "@/lib/formatters";
import { SortableQueueItem } from "./queue-item";
import { QueueNowPlaying } from "./queue-now-playing";
import { ListMusic, Trash2, Music, Loader2, GripVertical, AlertTriangle, Clock } from "lucide-react";

export function QueueDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);

  const queue = useQueueStore((s) => s.queue);
  const removingSongId = useQueueStore((s) => s.removingSongId);
  const isReordering = useQueueStore((s) => s.isReordering);
  const { moveQueueSong, jumpToQueueSong, removeFromQueue, clearQueue } = useQueueEditing();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPlayerBusy) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    if (from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
    moveQueueSong(from, to);
  };

  const totalQueueSeconds = queue.reduce((acc, curr) => acc + curr.duration, 0);

  if (!isOpen) return null;

  return (
    <>
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      icon={<ListMusic size={20} />}
      title="Cola de Reproducción"
      subtitle={`${queue.length} temas en espera — Duración aproximada: ~${formatDuration(totalQueueSeconds)}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger-soft"
            size="sm"
            onPress={() => setIsConfirmClearOpen(true)}
            isDisabled={queue.length === 0 || isPlayerBusy || !!removingSongId}
            className="flex items-center gap-1.5"
          >
            {pendingAction === "clear" ? (
              <>
                <Loader2 size={13} className="animate-spin text-rose-400" />
                <span>Vaciando</span>
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
          <QueueNowPlaying
            song={currentSong}
            isPlaying={isPlaying}
            isFav={isFavorite(currentSong.id) || isFavorite(currentSong.url)}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* Queued Songs List */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>A continuación ({queue.length})</span>
            {isReordering ? (
              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Actualizando orden
              </span>
            ) : queue.length > 1 && !isPlayerBusy ? (
              <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1">
                <GripVertical size={11} />
                Arrastra para reordenar
              </span>
            ) : null}
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
            <div className={`relative transition-opacity duration-200 ${isReordering || !!removingSongId || isPlayerBusy ? "pointer-events-none opacity-60 select-none" : ""}`}>
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
                        isFav={isFavorite(song.id) || isFavorite(song.url)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </GlassModal>

    {/* Modal para Confirmar Vaciado de la Cola */}
    <ConfirmDialog
      isOpen={isConfirmClearOpen}
      onClose={() => setIsConfirmClearOpen(false)}
      onConfirm={() => {
        setIsConfirmClearOpen(false);
        clearQueue();
      }}
      maxWidth="md"
      icon={<Trash2 size={20} className="text-rose-500" />}
      title="Vaciar cola de reproducción"
      subtitle="¿Seguro que deseas eliminar todas las canciones en espera?"
      cancelText="Conservar cola"
      confirmText={pendingAction === "clear" ? "Vaciando" : "Vaciar cola ahora"}
      confirmVariant="danger"
      confirmIcon={<Trash2 size={14} />}
      isLoading={pendingAction === "clear"}
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <ListMusic size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {queue.length} {queue.length === 1 ? "canción en espera" : "canciones en espera"}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock size={12} className="text-purple-400" />
              <span>Duración total aproximada: ~{formatDuration(totalQueueSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta acción eliminará todas las pistas pendientes de la lista para todos los miembros conectados al canal de voz de Discord. El tema que está sonando actualmente continuará hasta terminar.
          </p>
        </div>
      </div>
    </ConfirmDialog>
    </>
  );
}
