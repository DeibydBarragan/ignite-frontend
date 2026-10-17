"use client";

import { useState } from "react";
import type { DiscordGuild } from "@/types/domain";
import { CoverImage } from "@/components/ui/cover-image";
import { Server, ChevronDown, Check, Users } from "lucide-react";

export interface GuildSelectorProps {
  guilds: DiscordGuild[];
  selectedGuild: DiscordGuild | null;
  selectedGuildId: string;
  onSelectGuildId: (id: string) => void;
}

export function GuildSelector({
  guilds,
  selectedGuild,
  selectedGuildId,
  onSelectGuildId,
}: GuildSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!selectedGuild) {
    return (
      <div className="glass-btn flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10">
        <Server size={14} className="text-slate-400 animate-pulse" />
        <span className="text-xs text-slate-400">Cargando servidores…</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-btn flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-left hover:border-purple-500/30 transition-all cursor-pointer"
      >
        <div className="relative">
          <CoverImage
            src={selectedGuild.icon}
            alt={selectedGuild.name}
            className="w-7 h-7 rounded-lg ring-1 ring-black/10 dark:ring-white/15"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b0d14]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white max-w-[130px] sm:max-w-[160px] truncate leading-tight">
            {selectedGuild.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono tabular-nums">
            <Users size={10} />
            <span>{selectedGuild.memberCount} miembros</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-slate-400 ml-0.5 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="glass-dropdown absolute left-0 mt-2 w-64 p-2 z-40 bg-white/55 dark:bg-[#12151f]/55 backdrop-blur-xl border border-black/10 dark:border-white/10 glass-modal-enter shadow-2xl">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={12} />
              <span>Servidores disponibles</span>
            </div>
            <div className="mt-1 space-y-1">
              {guilds.map((g) => {
                const isSelected = g.id === selectedGuildId;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      onSelectGuildId(g.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CoverImage
                        src={g.icon}
                        alt={g.name}
                        className="w-7 h-7 rounded-lg"
                      />
                      <div className="truncate">
                        <div className="text-xs truncate">{g.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {g.voiceChannels.length} canales de voz
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-purple-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
