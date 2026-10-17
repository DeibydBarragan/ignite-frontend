"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DiscordGuild, VoiceChannel } from "@/types/domain";
import { igniteApi } from "@/lib/ignite-api";

export function useDiscordGuilds(
  isLoggedIn: boolean,
  setGuilds: Dispatch<SetStateAction<DiscordGuild[]>>,
  setSelectedGuildId: Dispatch<SetStateAction<string>>
): void {
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    const load = async () => {
      try {
        const apiGuilds = await igniteApi.getGuilds();
        if (cancelled || apiGuilds.length === 0) return;

        const withChannels = await Promise.all(
          apiGuilds.map(async (g) => {
            const channels = await igniteApi.getVoiceChannels(g.id);
            const voiceChannels: VoiceChannel[] = channels.map((c) => ({
              id: c.id,
              name: c.name,
              userCount: c.userCount,
              bitrate: c.bitrate,
            }));
            return {
              id: g.id,
              name: g.name,
              icon: g.icon || "https://cdn.discordapp.com/embed/avatars/0.png",
              memberCount: g.memberCount,
              botPresent: true,
              voiceChannels,
            } as DiscordGuild;
          })
        );

        if (cancelled || withChannels.length === 0) return;
        setGuilds(withChannels);
        setSelectedGuildId((prev) =>
          withChannels.some((g) => g.id === prev) ? prev : withChannels[0].id
        );
      } catch {
        // Sin servidores disponibles: se mantiene el estado actual.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setGuilds, setSelectedGuildId]);
}
