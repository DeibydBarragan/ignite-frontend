import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Top navbar skeleton */}
      <header className="sticky top-0 z-40 h-16 border-b border-black/10 dark:border-white/10 glass-panel">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
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

      {/* Main content skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-6 pb-28">
        {/* Toolbar skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-10 rounded-xl" />
            <Skeleton className="w-36 h-10 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-10 rounded-xl" />
            <Skeleton className="w-24 h-10 rounded-xl" />
            <Skeleton className="w-24 h-10 rounded-xl" />
          </div>
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel p-3 rounded-2xl flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="w-3/4 h-4 rounded-md" />
              <Skeleton className="w-1/2 h-3 rounded-md" />
            </div>
          ))}
        </div>
      </main>

      {/* Dock skeleton */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 border-t border-black/10 dark:border-white/10 glass-panel px-4 flex items-center justify-between max-w-7xl mx-auto rounded-t-2xl">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <Skeleton className="w-28 h-4 rounded-full" />
      </footer>
    </div>
  );
}
