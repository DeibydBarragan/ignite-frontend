"use client";

import { useBot } from "@/context/bot-context";
import { Volume2, Users } from "lucide-react";

export function VoiceBanner() {
  const { isVoiceConnected, currentVoiceChannel } = useBot();

  if (!isVoiceConnected || !currentVoiceChannel) return null;

  return (
    <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-[#1db954]/25 bg-[#1db954]/[0.04] dark:bg-[#1db954]/[0.03] text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1db954]" />
        </span>
        <Volume2 size={13} className="text-[#1db954] shrink-0" />
        <span className="font-medium text-slate-900 dark:text-white truncate">
          {currentVoiceChannel.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono shrink-0">
        <Users size={12} className="text-[#1db954]" />
        <span>{currentVoiceChannel.userCount}</span>
      </div>
    </div>
  );
}
