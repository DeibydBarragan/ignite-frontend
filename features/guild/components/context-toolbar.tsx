"use client";

import { useAuth } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { GuildSelector } from "./guild-selector";
import { TabServiceBadge } from "@/components/tab-service-badge";
import { Volume2, VolumeX, Music, Mic } from "lucide-react";

export type ActiveTab = "music" | "tts" | "soundboard";

interface ContextToolbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function ContextToolbar({ activeTab, onTabChange }: ContextToolbarProps) {
  const {
    guilds,
    selectedGuildId,
    selectedGuild,
    setSelectedGuildId,
    isVoiceConnected,
    currentVoiceChannel,
    isBotOnline,
  } = useAuth();
  const hasLiveSong = usePlayerStore((s) => !!s.currentSong && s.isPlaying);

  const TABS = [
    {
      id: "music" as ActiveTab,
      label: "Música",
      icon: <Music size={14} />,
      live: hasLiveSong,
    },
    {
      id: "tts" as ActiveTab,
      label: "Voz & TTS",
      icon: <Mic size={14} />,
      live: false,
    },
    {
      id: "soundboard" as ActiveTab,
      label: "Soundboard",
      icon: <Volume2 size={14} />,
      live: false,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
      {/* LEFT: Contexto de servidor y canal de voz */}
      <div className="flex items-center gap-2 flex-wrap">
        <GuildSelector
          guilds={guilds}
          selectedGuild={selectedGuild}
          selectedGuildId={selectedGuildId}
          onSelectGuildId={setSelectedGuildId}
        />

        {/* Indicador de Canal de Voz Activo */}
        {isVoiceConnected && currentVoiceChannel ? (
          <div
            title={`Conectado al canal ${currentVoiceChannel.name} (${currentVoiceChannel.userCount} oyentes)`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1db954]/25 bg-[#1db954]/[0.05] dark:bg-[#1db954]/[0.03] text-xs transition-colors"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1db954]" />
            </span>
            <Volume2 size={13} className="text-[#1db954] shrink-0" />
            <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
              {currentVoiceChannel.name}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
              {currentVoiceChannel.userCount}
            </span>
          </div>
        ) : (
          <div
            title="Sin canal de voz activo en este servidor"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-slate-400"
          >
            <VolumeX size={12} className="shrink-0 text-slate-400" />
            <span className="text-[11px]">Sin canal de voz</span>
          </div>
        )}

        {/* Indicador de Estado del Servicio Activo */}
        <TabServiceBadge activeTab={activeTab} isBotOnline={isBotOnline} />
      </div>

      {/* RIGHT: Tabs de navegación */}
      <nav
        role="tablist"
        aria-label="Vistas del bot"
        className="p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md flex items-center gap-1 shadow-xs self-start md:self-auto"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-white/80 dark:bg-white/10 backdrop-blur-md text-slate-900 dark:text-white shadow-xs border border-black/[0.06] dark:border-white/[0.09] font-medium"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-normal"
              }`}
            >
              <span className={isSelected ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>

              {tab.live && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1db954] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1db954]" />
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
