import { create } from "zustand";
import type { Guild, VoiceChannel } from "@/types/domain";
import { publicEnv } from "@/lib/env";

export interface GuildState {
  guilds: Guild[];
  selectedGuildId: string;
  currentVoiceChannel: VoiceChannel | null;
  botVoiceChannel: { id: string; name: string } | null;
  isBotOnline: boolean;
  isVoiceConnected: boolean;
  voiceChannels: VoiceChannel[];
  setGuilds: (guilds: Guild[]) => void;
  setSelectedGuildId: (guildId: string) => void;
  setCurrentVoiceChannel: (channel: VoiceChannel | null) => void;
  setBotVoiceChannel: (channel: { id: string; name: string } | null) => void;
  setIsBotOnline: (isBotOnline: boolean) => void;
  setIsVoiceConnected: (isVoiceConnected: boolean) => void;
  setVoiceChannels: (voiceChannels: VoiceChannel[]) => void;
}

const defaultGuildId = publicEnv.NEXT_PUBLIC_DEFAULT_GUILD_ID ?? "";

export const useGuildStore = create<GuildState>((set) => ({
  guilds: [],
  selectedGuildId: defaultGuildId,
  currentVoiceChannel: null,
  botVoiceChannel: null,
  isBotOnline: true,
  isVoiceConnected: false,
  voiceChannels: [],

  setGuilds: (guilds) => set({ guilds }),
  setSelectedGuildId: (selectedGuildId) => set({ selectedGuildId }),
  setCurrentVoiceChannel: (currentVoiceChannel) => set({ currentVoiceChannel }),
  setBotVoiceChannel: (botVoiceChannel) => set({ botVoiceChannel }),
  setIsBotOnline: (isBotOnline) => set({ isBotOnline }),
  setIsVoiceConnected: (isVoiceConnected) => set({ isVoiceConnected }),
  setVoiceChannels: (voiceChannels) => set({ voiceChannels }),
}));
