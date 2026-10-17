import { Loader2, ListPlus, Plus } from "lucide-react";

export interface SongCoverOverlaysProps {
  isLoadingPlay: boolean;
  showNextFeedback: boolean;
  showQueueFeedback: boolean;
  showEqualizer: boolean;
}

/** Overlays de la carátula: carga de reproducción, feedback de Sig/cola y ecualizador. */
export function SongCoverOverlays({
  isLoadingPlay,
  showNextFeedback,
  showQueueFeedback,
  showEqualizer,
}: SongCoverOverlaysProps) {
  return (
    <>
      {/* 1. Loading Overlay when Play is clicked (con tinte esmeralda/verde, spinner grande directo sin texto) */}
      {isLoadingPlay && (
        <div className="absolute inset-0 bg-emerald-950/75 backdrop-blur-xs flex items-center justify-center z-30 animate-in fade-in duration-150">
          <Loader2 size={38} className="animate-spin text-[#1ed760] drop-shadow-[0_0_14px_rgba(30,215,96,0.7)]" />
        </div>
      )}

      {/* 2. Visual feedback animation when "Sig" is clicked (mismo estilo de icono que cargando) */}
      {showNextFeedback && (
        <div className="absolute inset-0 bg-purple-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30 animate-in zoom-in-95 fade-in duration-150 pointer-events-none">
          <ListPlus size={38} className="text-purple-300 drop-shadow-[0_0_14px_rgba(192,132,252,0.8)] animate-bounce" />
          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-200 border border-purple-400/30 text-[10px] font-bold tracking-wide shadow-md">
            ¡Siguiente en cola!
          </span>
        </div>
      )}

      {/* 3. Visual feedback animation when "Añadir a la cola" completes (Point 4) */}
      {showQueueFeedback && (
        <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30 animate-in zoom-in-95 fade-in duration-150 pointer-events-none">
          <Plus size={38} strokeWidth={3} className="text-[#1ed760] drop-shadow-[0_0_14px_rgba(30,215,96,0.8)] animate-bounce" />
          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-200 border border-emerald-400/30 text-[10px] font-bold tracking-wide shadow-md">
            ¡Añadido a la cola!
          </span>
        </div>
      )}

      {/* 4. Equalizer overlay when playing (5 barras dinámicas centradas, sin texto de sonando) */}
      {showEqualizer && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 animate-in fade-in duration-200 pointer-events-none">
          <div className="flex items-end justify-center gap-1.5 h-8">
            <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-1 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
            <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-2 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
            <span className="w-1.5 bg-purple-400 rounded-full cover-eq-3 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-4 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
            <span className="w-1.5 bg-purple-400 rounded-full cover-eq-5 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
          </div>
        </div>
      )}
    </>
  );
}
