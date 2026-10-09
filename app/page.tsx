"use client";

import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import { ContextToolbar, type ActiveTab } from "@/components/context-toolbar";
import { MusicView } from "@/components/music/music-view";
import { TTSView } from "@/components/tts/tts-view";
import { SoundboardView } from "@/components/soundboard/soundboard-view";
import { PlayerBar } from "@/components/music/player-bar";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("music");

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Top Header Navigation (Clean brand & user bar) */}
      <AppNav />

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
    </div>
  );
}
