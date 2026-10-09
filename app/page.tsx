"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import { AppNav } from "@/components/app-nav";
import { ContextToolbar, type ActiveTab } from "@/components/context-toolbar";
import { MusicView } from "@/components/music/music-view";
import { TTSView } from "@/components/tts/tts-view";
import { SoundboardView } from "@/components/soundboard/soundboard-view";
import { PlayerBar } from "@/components/music/player-bar";
import {
  Flame,
  Loader2,
  Lock,
  LogIn,
  Music,
  Radio,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { isLoggedIn, isLoadingAuth, loginDiscord } = useBot();
  const [activeTab, setActiveTab] = useState<ActiveTab>("music");

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Top Header Navigation */}
      <AppNav />

      {/* Auth Gatekeeper */}
      {isLoadingAuth ? (
        <main className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh]">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center animate-pulse">
              <Flame size={32} className="text-purple-400" />
            </div>
            <Loader2 size={44} className="animate-spin text-purple-500 absolute" />
          </div>
          <p className="mt-4 text-xs font-mono text-slate-400">
            Verificando sesión con Discord...
          </p>
        </main>
      ) : !isLoggedIn ? (
        <main className="flex-1 flex items-center justify-center px-4 py-12 max-w-lg mx-auto w-full">
          <div className="glass-panel p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl text-center flex flex-col items-center relative overflow-hidden w-full">
            {/* Background ambient glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Icon Badge */}
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-600/30">
                <Flame size={38} className="text-white fill-white/20" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#5865f2] text-white shadow-md">
                <ShieldAlert size={14} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
              <Lock size={12} />
              <span>Acceso Restringido</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ignite Music Bot
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
              Inicia sesión con tu cuenta de Discord para acceder al reproductor, controlar la música y ver tu biblioteca personal de favoritos.
            </p>

            {/* Feature bullets */}
            <div className="w-full my-6 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span>Catálogo de canciones favoritas sincronizado</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Music size={14} className="text-[#1db954] shrink-0" />
                <span>Control de pistas, volumen y cola de espera en vivo</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Radio size={14} className="text-purple-400 shrink-0" />
                <span>Efectos de sonido (Soundboard) y TTS en Discord</span>
              </div>
            </div>

            {/* Discord Login Button */}
            <button
              onClick={loginDiscord}
              className="w-full py-3.5 px-6 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-[#5865f2]/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
            >
              <LogIn size={18} className="transition-transform group-hover:translate-x-0.5" />
              <span>Conectar con Discord</span>
            </button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
              Solo verificamos tu usuario de Discord para sincronizar tus favoritos.
            </p>
          </div>
        </main>
      ) : (
        <>
          {/* Main Content Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-6">
            {/* Context & Navigation Toolbar (Server, Voice Channel, Tabs) */}
            <ContextToolbar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content Panes */}
            <div className="flex-1">
              {activeTab === "music" && <MusicView />}
              {activeTab === "tts" && <TTSView />}
              {activeTab === "soundboard" && <SoundboardView />}
            </div>
          </main>

          {/* Persistent Floating Bottom Player Bar */}
          <PlayerBar />
        </>
      )}
    </div>
  );
}
