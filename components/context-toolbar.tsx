"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import {
  Users,
  ChevronDown,
  Check,
  Server,
  Volume2,
  VolumeX,
  Music,
  Mic,
} from "lucide-react";

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
    currentSong,
    isPlaying,
  } = useBot();

  const [isGuildDropdownOpen, setIsGuildDropdownOpen] = useState(false);

  const TABS = [
    {
      id: "music" as ActiveTab,
      label: "Música",
      icon: <Music size={14} />,
      live: currentSong && isPlaying,
    },
    {
      id: "tts" as ActiveTab,
      label: "Voz & TTS",
      icon: <Mic size={14} />,
      live: false,
    },
    {
      id: "soundboard" as ActiveTab,
      label: "Soundboard & Triggers",
      icon: <Volume2 size={14} />,
      live: false,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
      {/* ══════════ LEFT: CONTEXTO DE SERVIDOR Y CANAL DE VOZ ══════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Selector de Servidor */}
        <div className="relative">
          <button
            onClick={() => setIsGuildDropdownOpen((prev) => !prev)}
            className="glass-btn flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-left hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedGuild.icon}
                alt={selectedGuild.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/15"
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

          {/* Menú Desplegable de Servidores */}
          {isGuildDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsGuildDropdownOpen(false)}
              />
              <div className="glass-dropdown absolute left-0 mt-2 w-64 p-2 z-40 border border-black/10 dark:border-white/10 glass-modal-enter shadow-2xl">
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
                          setSelectedGuildId(g.id);
                          setIsGuildDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                            : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={g.icon}
                            alt={g.name}
                            className="w-7 h-7 rounded-lg object-cover"
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

        {/* Indicador de Canal de Voz Activo (sin nombre de servidor) */}
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
      </div>

      {/* ══════════ RIGHT: TABS DE NAVEGACIÓN ══════════ */}
      <nav
        aria-label="Vistas del bot"
        className="p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md flex items-center gap-1 shadow-xs self-start md:self-auto"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-[#141624] text-slate-900 dark:text-white shadow-xs border border-black/[0.06] dark:border-white/[0.09] font-medium"
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
