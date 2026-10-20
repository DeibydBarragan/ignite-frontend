"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import dynamic from "next/dynamic";
import { AuthWall } from "@/features/auth/components/auth-wall";
import { AppNav } from "@/components/app-nav";
import { ContextToolbar, type ActiveTab } from "@/features/guild/components/context-toolbar";
import { MusicView } from "@/features/music/components/music-view/music-view";
import { TabLoadingSkeleton } from "@/components/ui/tab-loading-skeleton";
import { PlayerBar } from "@/features/music/components/player-bar/player-bar";
import {
  getServerTabSnapshot,
  getTabSnapshot,
  normalizeTabUrl,
  setActiveTab,
  subscribeTab,
} from "@/lib/tab-store";

const SoundboardView = dynamic(
  () =>
    import("@/features/soundboard/components/soundboard-view").then(
      (m) => m.SoundboardView
    ),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false,
  }
);

const TTSView = dynamic(
  () =>
    import("@/features/tts/components/tts-view").then((m) => m.TTSView),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false,
  }
);

const VoiceView = dynamic(
  () =>
    import("@/features/voice/components/voice-view").then((m) => m.VoiceView),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false,
  }
);

export function DashboardView() {
  const { isLoggedIn, isLoadingAuth, loginDiscord } = useAuth();
  const hasSong = usePlayerStore((s) => s.currentSong !== null);
  const isPlayerCollapsed = usePlayerStore((s) => s.isPlayerCollapsed);
  const activeTab = useSyncExternalStore(subscribeTab, getTabSnapshot, getServerTabSnapshot);

  useEffect(() => {
    normalizeTabUrl(getTabSnapshot());

    // Precarga silenciosa en tiempo ocioso para que el cambio de pestaña sea inmediato
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
        void import("@/features/soundboard/components/soundboard-view");
        void import("@/features/tts/components/tts-view");
        void import("@/features/voice/components/voice-view");
      });
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }
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
          {activeTab === "voice" && <VoiceView />}
        </div>
      </main>
      <PlayerBar />
    </div>
  );
}
