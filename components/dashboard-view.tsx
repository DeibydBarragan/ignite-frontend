"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { AuthWall } from "@/features/auth/components/auth-wall";
import { AppNav } from "@/components/app-nav";
import { ContextToolbar, type ActiveTab } from "@/features/guild/components/context-toolbar";
import { MusicView } from "@/features/music/components/music-view/music-view";
import { TTSView } from "@/features/tts/components/tts-view";
import { SoundboardView } from "@/features/soundboard/components/soundboard-view";
import { PlayerBar } from "@/features/music/components/player-bar/player-bar";
import {
  getServerTabSnapshot,
  getTabSnapshot,
  normalizeTabUrl,
  setActiveTab,
  subscribeTab,
} from "@/lib/tab-store";

export function DashboardView() {
  const { isLoggedIn, isLoadingAuth, loginDiscord } = useAuth();
  const hasSong = usePlayerStore((s) => s.currentSong !== null);
  const isPlayerCollapsed = usePlayerStore((s) => s.isPlayerCollapsed);
  const activeTab = useSyncExternalStore(subscribeTab, getTabSnapshot, getServerTabSnapshot);

  useEffect(() => {
    normalizeTabUrl(getTabSnapshot());
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  if (!isLoggedIn && !isLoadingAuth) {
    return <AuthWall isLoading={isLoadingAuth} onLogin={loginDiscord} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
      <AppNav />
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-6 transition-[padding] duration-200 ${
          hasSong
            ? isPlayerCollapsed
              ? "pb-24 sm:pb-20"
              : "pb-72 sm:pb-60 md:pb-28"
            : "pb-10"
        }`}
      >
        <ContextToolbar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1">
          {activeTab === "music" && <MusicView />}
          {activeTab === "soundboard" && <SoundboardView />}
          {activeTab === "tts" && <TTSView />}
        </div>
      </main>
      <PlayerBar />
    </div>
  );
}
