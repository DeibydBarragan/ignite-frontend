import type { DiscordUser } from "@/types/domain";

export type SessionUserLike = {
  id?: string;
  user_metadata?: Record<string, unknown>;
  identities?: Array<{
    provider?: string;
    id?: string;
    identity_data?: Record<string, unknown>;
  }>;
};

const readString = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

export function resolveDiscordId(sessionUser: SessionUserLike): string {
  const meta = (sessionUser.user_metadata ?? {}) as Record<string, unknown>;
  const identities = sessionUser.identities ?? [];
  const discordIdentity = identities.find((i) => i.provider === "discord") || identities[0];
  const identityData = (discordIdentity?.identity_data ?? {}) as Record<string, unknown>;
  const customClaims = (meta.custom_claims ?? {}) as Record<string, unknown>;
  return (
    readString(discordIdentity?.id) ||
    readString(identityData.provider_id) ||
    readString(identityData.sub) ||
    readString(customClaims.sub) ||
    readString(meta.provider_id) ||
    readString(meta.sub) ||
    readString(sessionUser.id) ||
    ""
  );
}

export function extractDiscordUser(sessionUser: SessionUserLike): DiscordUser {
  const meta = (sessionUser.user_metadata ?? {}) as Record<string, unknown>;
  const customClaims = (meta.custom_claims ?? {}) as Record<string, unknown>;
  const username =
    readString(customClaims.global_name) ||
    readString(meta.full_name) ||
    readString(meta.user_name) ||
    readString(meta.name) ||
    "Usuario";
  const avatar = readString(meta.avatar_url) || "https://cdn.discordapp.com/embed/avatars/0.png";
  return {
    id: resolveDiscordId(sessionUser),
    username,
    discriminator: "0",
    avatar,
    status: "online",
    isVoiceConnected: false,
    currentChannelId: null,
  };
}
