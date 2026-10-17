/** Filas esqueleto con la forma de la lista de temas. */
export function TrackSkeletonRows({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2">
          <span className="text-[11px] font-mono text-slate-400/50 w-6 text-center shrink-0">
            {i + 1}
          </span>
          <span className="w-9 h-9 rounded-lg ignite-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-md ignite-shimmer" style={{ width: `${72 - (i % 3) * 12}%` }} />
            <div className="h-2 rounded-md ignite-shimmer" style={{ width: `${46 - (i % 2) * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
