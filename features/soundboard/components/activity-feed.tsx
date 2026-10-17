"use client";

import { useLiveEvents } from "@/context/live-events-context";
import { Activity } from "lucide-react";

export function ActivityFeed() {
  const { liveEvents, clearLiveEvents } = useLiveEvents();

  return (
    <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity size={16} className="text-purple-500 dark:text-purple-400" />
          <span>Actividad</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Últimos eventos de música, voz y soundboard.
        </p>
      </div>

      {/* Live Event Monitor */}
      <div className="grid grid-cols-1 gap-5">
        {/* Live Activity Feed / Monitor */}
        <div className="glass-panel p-4 border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1db954] animate-pulse" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Monitor de Actividad
              </h3>
            </div>
            <button
              onClick={clearLiveEvents}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {liveEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Esperando eventos de música, voz o soundboard...
              </p>
            ) : (
              liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {evt.title}
                    </span>
                    <span className="font-mono tabular-nums">{evt.timestamp}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
