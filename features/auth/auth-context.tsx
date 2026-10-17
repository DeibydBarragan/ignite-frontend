"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { DiscordGuild, DiscordUser } from "@/types/domain";
import type { AuthContextValue, AuthCoreValue, AuthVoiceStatusLike } from "@/types/auth";
import { igniteApi } from "@/lib/ignite-api";
import { supabase } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { extractDiscordUser } from "@/lib/discord-profile";
import { setApiUserId } from "@/lib/http";
import { useDiscordGuilds } from "@/hooks/use-discord-guilds";
import { useGuildStore } from "@/features/guild/guild-store";
import { usePoll } from "@/hooks/use-poll";

const AuthCoreContext = createContext<AuthCoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [selectedGuildId, setSelectedGuildIdState] = useState<string>(
    publicEnv.NEXT_PUBLIC_DEFAULT_GUILD_ID ?? ""
  );
  const setSelectedGuildId = useCallback((id: string) => {
    setSelectedGuildIdState(id);
    useGuildStore.getState().setSelectedGuildId(id);
  }, []);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState("");
  const isBotOnline = useGuildStore((s) => s.isBotOnline);
  const setIsBotOnline = useGuildStore((s) => s.setIsBotOnline);
  const botVoiceChannelRef = useRef<{ id: string; name: string } | null>(null);

  const setBotVoiceChannel = useCallback((channel: { id: string; name: string } | null) => {
    botVoiceChannelRef.current = channel;
  }, []);

  const applyVoiceStatus = useCallback((status: AuthVoiceStatusLike) => {
    if (status.user) {
      setIsVoiceConnected(true);
      setCurrentVoiceChannelId(status.user.id);
    } else {
      setIsVoiceConnected(false);
      setCurrentVoiceChannelId("");
    }
    botVoiceChannelRef.current = status.bot;
  }, []);

  usePoll(
    async () => {
      if (!isLoggedIn || !user || !selectedGuildId) return;
      const status = await igniteApi.getVoiceStatus(selectedGuildId, user.id);
      if (status) applyVoiceStatus(status);
    },
    {
      enabled: isLoggedIn && Boolean(user) && Boolean(selectedGuildId),
      intervalMs: 3000,
      immediate: true,
    }
  );

  useDiscordGuilds(isLoggedIn, setGuilds, setSelectedGuildIdState);

  useEffect(() => {
    useGuildStore.getState().setSelectedGuildId(selectedGuildId);
  }, [selectedGuildId]);

  useEffect(() => {
    const applySession = (session: Session | null) => {
      if (session?.user) {
        const discordUser = extractDiscordUser(session.user);
        setUser(discordUser);
        setApiUserId(discordUser.id);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setApiUserId(null);
        setIsLoggedIn(false);
      }
      setIsLoadingAuth(false);
    };

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      applySession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  usePoll(
    async () => {
      try {
        const health = await igniteApi.getHealth();
        setIsBotOnline(Boolean(health));
      } catch {
        setIsBotOnline(false);
      }
    },
    {
      enabled: true,
      intervalMs: 15000,
      immediate: true,
    }
  );

  const loginDiscord = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
    } catch (err) {
      logger.error("Discord login error:", err);
    }
  }, []);

  const logoutDiscord = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setApiUserId(null);
      setIsLoggedIn(false);
    } catch (err) {
      logger.error("Logout error:", err);
    }
  }, []);

  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) || guilds[0] || null;
  const currentVoiceChannel = isVoiceConnected
    ? selectedGuild?.voiceChannels.find((vc) => vc.id === currentVoiceChannelId) ||
      selectedGuild?.voiceChannels[0] ||
      null
    : null;

  const setVoiceConnection = useCallback(
    (connected: boolean, channelId?: string) => {
      if (!isLoggedIn) return;
      setIsVoiceConnected(connected);
      if (connected && channelId) {
        setCurrentVoiceChannelId(channelId);
      } else if (connected && !channelId && (selectedGuild?.voiceChannels.length || 0) > 0) {
        setCurrentVoiceChannelId(selectedGuild!.voiceChannels[0].id);
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isVoiceConnected: connected,
              currentChannelId: connected
                ? channelId || selectedGuild?.voiceChannels[0]?.id || null
                : null,
            }
          : null
      );
    },
    [isLoggedIn, selectedGuild]
  );

  const value = useMemo<AuthCoreValue>(
    () => ({
      user,
      isLoggedIn,
      isLoadingAuth,
      loginDiscord,
      logoutDiscord,
      guilds,
      selectedGuildId,
      selectedGuild,
      setSelectedGuildId,
      isVoiceConnected,
      currentVoiceChannel,
      isBotOnline,
      setVoiceConnection,
      currentVoiceChannelId,
      setIsBotOnline,
      setIsVoiceConnected,
      setCurrentVoiceChannelId,
      setBotVoiceChannel,
      applyVoiceStatus,
      botVoiceChannelRef,
    }),
    [
      user,
      isLoggedIn,
      isLoadingAuth,
      loginDiscord,
      logoutDiscord,
      guilds,
      selectedGuildId,
      selectedGuild,
      isVoiceConnected,
      currentVoiceChannel,
      isBotOnline,
      setVoiceConnection,
      currentVoiceChannelId,
      setSelectedGuildId,
      setIsBotOnline,
      setBotVoiceChannel,
      applyVoiceStatus,
    ]
  );

  return <AuthCoreContext.Provider value={value}>{children}</AuthCoreContext.Provider>;
}

export function useAuthCore(): AuthCoreValue {
  const ctx = useContext(AuthCoreContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function useAuth(): AuthContextValue {
  return useAuthCore();
}
