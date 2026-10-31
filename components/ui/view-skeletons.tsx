import { Skeleton } from "@/components/ui/skeleton";
import { SONG_GRID, SOUND_GRID } from "@/components/ui/grids";
import { SongCardSkeleton } from "@/features/music/components/song-card";
import { SoundPadSkeleton } from "@/features/soundboard/components/sound-pad";
import { SavedPhrasesSkeleton } from "@/features/tts/components/saved-phrases-card";

/** Barra de herramientas simulada: un control ancho a la izquierda y acciones a la derecha. */
function ToolbarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-card">
      <Skeleton className="h-9 w-44 rounded-xl" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/** Rejilla de canciones en carga. Usa SONG_GRID, el MISMO grid que la lista real. */
export function SongGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={SONG_GRID} aria-busy="true" aria-label="Cargando canciones">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Carga de la vista Soundboard: barra + rejilla de pads con su forma real. */
export function SoundboardViewSkeleton() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="Cargando soundboard">
      <ToolbarSkeleton />
      <div className={SOUND_GRID}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SoundPadSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/** Carga de la vista TTS: compositor a la izquierda, frases a la derecha (grid 1 / 3). */
export function TtsViewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Cargando sintetizador de voz">
      <div className="lg:col-span-2 glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded-md" />
            <Skeleton className="h-2.5 w-56 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <div className="glass-card p-4 border border-black/5 dark:border-white/10">
          <SavedPhrasesSkeleton />
        </div>
      </div>
    </div>
  );
}

/** Carga de la vista de Comandos de Voz: barra fija, pestañas y tarjeta de contenido. */
export function VoiceViewSkeleton() {
  return (
    <div className="space-y-5 pb-12" aria-busy="true" aria-label="Cargando comandos de voz">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-48 rounded-md" />
            <Skeleton className="h-2.5 w-32 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 rounded-xl glass-card w-fit">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
