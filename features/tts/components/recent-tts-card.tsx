"use client";

import type { TTSMessage } from "@/types/domain";
import { Radio } from "lucide-react";

export function RecentTTSCard({ messages }: { messages: TTSMessage[] }) {
  return (
    <div className="glass-card p-4 border border-black/5 dark:border-white/10">
      <div className="flex items-center gap-2 mb-3 border-b border-black/5 dark:border-white/5 pb-2.5">
        <Radio size={15} className="text-purple-600 dark:text-purple-400" />
        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
          Emisiones Recientes
        </h4>
      </div>

      {messages.length === 0 ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 py-2">
          Aún no has emitido mensajes TTS.
        </p>
      ) : (
        <div className="space-y-2">
          {messages.slice(0, 5).map((msg) => (
            <div
              key={msg.id}
              className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5"
            >
              <p className="text-[11px] text-slate-700 dark:text-slate-200 line-clamp-2">
                {msg.text}
              </p>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20 font-medium truncate max-w-[60%]">
                  {msg.voice}
                </span>
                <span className="font-mono">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
