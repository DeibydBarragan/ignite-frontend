import { test as base, type Page, expect } from "@playwright/test";
import {
  MOCK_GUILDS,
  MOCK_SONGS,
  MOCK_SOUNDS,
  MOCK_USER,
  MOCK_VOICE_CHANNELS,
  MOCK_VOICE_STATUS,
} from "./mock-data";

export const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  expires_in: 86400,
  token_type: "bearer",
  user: {
    id: MOCK_USER.id,
    aud: "authenticated",
    role: "authenticated",
    email: "tester@example.com",
    user_metadata: {
      user_name: MOCK_USER.username,
      full_name: MOCK_USER.displayName,
      avatar_url: MOCK_USER.avatar,
    },
  },
};

export async function setupMocks(page: Page, options: { authenticated?: boolean } = {}) {
  const { authenticated = false } = options;

  await page.route("**/auth/v1/user", async (route) => {
    if (authenticated) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION.user),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "unauthorized" }),
      });
    }
  });

  await page.route("**/auth/v1/session", async (route) => {
    if (authenticated) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "no_session" }),
      });
    }
  });

  await page.route("**/api/music/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/health")) {
      await route.fulfill({
        status: 200,
        json: { status: "ok", uptime: 12345, bot: { username: "IgniteBot" } },
      });
    } else if (url.includes("/channels")) {
      await route.fulfill({ status: 200, json: { channels: MOCK_VOICE_CHANNELS } });
    } else if (url.includes("/voice-status")) {
      await route.fulfill({ status: 200, json: MOCK_VOICE_STATUS });
    } else if (url.includes("/guilds") && !url.includes("/player") && !url.includes("/queue")) {
      await route.fulfill({ status: 200, json: { guilds: MOCK_GUILDS } });
    } else if (url.includes("/player") || url.includes("/now-playing")) {
      await route.fulfill({
        status: 200,
        json: {
          hasQueue: false,
          isPlaying: false,
          isPaused: false,
          currentTime: 0,
          duration: 0,
          volume: 80,
          repeatMode: "off",
          autoplay: false,
          filter: null,
          voiceChannel: { id: "vc-1", name: "Canal General" },
          currentSong: null,
          queue: [],
        },
      });
    } else if (url.includes("/recommendations")) {
      await route.fulfill({
        status: 200,
        json: { source: "top", basedOn: null, songs: MOCK_SONGS },
      });
    } else if (url.includes("/search")) {
      await route.fulfill({ status: 200, json: { results: MOCK_SONGS } });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/sound/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/health")) {
      await route.fulfill({ status: 200, json: { status: "ok" } });
    } else if (url.includes("/sounds/play")) {
      await route.fulfill({ status: 200, json: { success: true, message: "Reproduciendo" } });
    } else if (url.includes("/sounds")) {
      await route.fulfill({ status: 200, json: { sounds: MOCK_SOUNDS } });
    } else if (url.includes("/tts/speak")) {
      await route.fulfill({ status: 200, json: { success: true, message: "Enviado a Discord" } });
    } else if (url.includes("/voices")) {
      await route.fulfill({ status: 200, json: { voices: [] } });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  if (authenticated) {
    const cookieValue =
      "base64-" + Buffer.from(JSON.stringify(MOCK_SESSION)).toString("base64url");
    await page.context().addCookies([
      {
        name: "sb-qzedjwrpvcgmfqgsvxyi-auth-token",
        value: cookieValue,
        domain: "localhost",
        path: "/",
      },
    ]);
  } else {
    await page.context().clearCookies();
  }
}

export const test = base.extend<{
  authedPage: Page;
}>({
  authedPage: async ({ page }, provide) => {
    await setupMocks(page, { authenticated: true });
    await provide(page);
  },
});

export { expect };
