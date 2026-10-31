import type { MutableRefObject } from "react";
import type { DiscordGuild, DiscordUser, VoiceChannel } from "@/types/domain";

export interface AuthContextValue {
  user: DiscordUser | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  loginDiscord: () => Promise<void>;
  logoutDiscord: () => Promise<void>;
  guilds: DiscordGuild[];
  selectedGuildId: string;
  selectedGuild: DiscordGuild | null;
  setSelectedGuildId: (id: string) => void;
  isVoiceConnected: boolean;
  currentVoiceChannel: VoiceChannel | null;
  botVoiceChannel: { id: string; name: string } | null;
  isBotInVoice: boolean;
  isJoiningVoice: boolean;
  joinVoice: (channelId?: string) => Promise<boolean>;
  leaveVoice: () => Promise<boolean>;
  isBotOnline: boolean;
  setVoiceConnection: (connected: boolean, channelId?: string) => void;
}

export interface AuthVoiceStatusLike {
  bot: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
}

export interface AuthCoreValue extends AuthContextValue {
  currentVoiceChannelId: string;
  setIsBotOnline: (online: boolean) => void;
  setIsVoiceConnected: (connected: boolean) => void;
  setCurrentVoiceChannelId: (id: string) => void;
  setBotVoiceChannel: (channel: { id: string; name: string } | null) => void;
  applyVoiceStatus: (status: AuthVoiceStatusLike) => void;
  botVoiceChannelRef: MutableRefObject<{ id: string; name: string } | null>;
}
