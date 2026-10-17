import { describe, expect, it } from "vitest";
import { extractDiscordUser, resolveDiscordId } from "@/lib/discord-profile";

describe("resolveDiscordId", () => {
  it("prioriza el id de la identidad de discord", () => {
    expect(
      resolveDiscordId({
        id: "session-id",
        identities: [{ provider: "discord", id: "discord-id" }],
      })
    ).toBe("discord-id");
  });

  it("cae a identity_data.provider_id", () => {
    expect(
      resolveDiscordId({
        identities: [{ provider: "discord", identity_data: { provider_id: "provider-id" } }],
      })
    ).toBe("provider-id");
  });

  it("usa custom_claims.sub como respaldo", () => {
    expect(
      resolveDiscordId({
        user_metadata: { custom_claims: { sub: "claim-sub" } },
      })
    ).toBe("claim-sub");
  });

  it("cae al id de sesión", () => {
    expect(resolveDiscordId({ id: "session-id" })).toBe("session-id");
  });

  it("devuelve cadena vacía sin datos", () => {
    expect(resolveDiscordId({})).toBe("");
  });
});

describe("extractDiscordUser", () => {
  it("construye el usuario con metadatos completos", () => {
    const user = extractDiscordUser({
      id: "s-1",
      user_metadata: {
        custom_claims: { global_name: "Ignacio", sub: "d-1" },
        avatar_url: "https://cdn.example/avatar.png",
      },
    });
    expect(user.id).toBe("d-1");
    expect(user.username).toBe("Ignacio");
    expect(user.avatar).toBe("https://cdn.example/avatar.png");
    expect(user.status).toBe("online");
    expect(user.isVoiceConnected).toBe(false);
    expect(user.currentChannelId).toBeNull();
  });

  it("usa fallbacks por defecto", () => {
    const user = extractDiscordUser({ id: "s-2" });
    expect(user.id).toBe("s-2");
    expect(user.username).toBe("Usuario");
    expect(user.avatar).toBe("https://cdn.discordapp.com/embed/avatars/0.png");
    expect(user.discriminator).toBe("0");
  });
});
