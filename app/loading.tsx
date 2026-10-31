import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback de carga de la página (Suspense de servidor). Solo dibuja el armazón
 * COMÚN a todas las pestañas: navbar y barra de contexto. No pinta una rejilla
 * de contenido, porque la pestaña activa (música / soundboard / tts / voz) no se
 * conoce en el servidor: pintar una rejilla aquí mostraría una maquetación
 * genérica que el skeleton real de la vista reemplaza un instante después.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0b0d14]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="w-24 h-5 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-28 h-8 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
      </header>

      {/* Barra de contexto: servidor a la izquierda, pestañas a la derecha. Común a todas las vistas. */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-4 pb-10">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-44 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl glass-card w-fit self-start md:self-auto">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
