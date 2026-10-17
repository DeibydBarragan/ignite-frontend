import { Skeleton } from "@/components/ui/skeleton";

export function TabLoadingSkeleton() {
  return (
    <div
      className="space-y-4 animate-in fade-in duration-200"
      aria-busy="true"
      aria-label="Cargando contenido de la pestaña"
    >
      {/* Barra superior de herramientas simulada */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Grid simulado de tarjetas/pads */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-3.5 rounded-2xl flex flex-col justify-between h-32 gap-3"
          >
            <div className="flex items-start justify-between w-full">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-3 w-8 rounded-md" />
            </div>
            <div className="space-y-1.5 w-full">
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-2.5 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
