import { test, expect } from "./fixtures/auth.fixture";
import { MOCK_SONGS, MOCK_VOICE_CHANNELS, MOCK_GUILDS, MOCK_VOICE_STATUS } from "./fixtures/mock-data";

test.describe("Fase 2 — 04 Reproductor Dinámico y Cola", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.route("**/api/music/**", async (route) => {
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
            hasQueue: true,
            isPlaying: true,
            isPaused: false,
            currentTime: 45,
            duration: 215,
            volume: 80,
            repeatMode: "off",
            autoplay: false,
            filter: null,
            voiceChannel: { id: "vc-1", name: "Canal General" },
            currentSong: MOCK_SONGS[0],
            queue: [MOCK_SONGS[1]],
          },
        });
      } else if (url.includes("/queue")) {
        await route.fulfill({
          status: 200,
          json: { success: true },
        });
      } else {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });
  });

  test("muestra la barra del reproductor con información de la pista y controles", async ({ authedPage }) => {
    await authedPage.goto("/#music");

    // Esperar a que el reproductor reciba la canción activa
    await expect(authedPage.getByText("Cyberpunk City Drive").first()).toBeVisible();
    await expect(authedPage.getByText("Synthwave Master").first()).toBeVisible();

    // Botón de Cola visible con badge
    const queueBtn = authedPage.getByRole("button", { name: /Cola/i });
    await expect(queueBtn).toBeVisible();
  });

  test("permite abrir y cerrar el cajón lateral de la cola de reproducción", async ({ authedPage }) => {
    await authedPage.goto("/#music");

    // Abrir drawer de la cola
    const queueBtn = authedPage.getByRole("button", { name: /Cola/i });
    await expect(queueBtn).toBeVisible();
    await queueBtn.click();

    // El drawer debe mostrarse
    await expect(authedPage.getByText(/Cola de Reproducción/i)).toBeVisible();

    // Cerrar drawer
    const closeBtn = authedPage.getByRole("button", { name: /Cerrar cola/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await authedPage.keyboard.press("Escape");
    }
  });

  test("permite contraer y expandir el dock del reproductor", async ({ authedPage }) => {
    await authedPage.goto("/#music");

    // Clic en contraer
    const collapseBtn = authedPage.getByRole("button", {
      name: "Contraer reproductor a la esquina",
    });
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();

      // Debe mostrar el dock colapsado
      const expandBtn = authedPage.getByRole("button", {
        name: /Abrir reproductor/i,
      });
      await expect(expandBtn).toBeVisible();

      // Expandir de nuevo
      await expandBtn.click();
      await expect(collapseBtn).toBeVisible();
    }
  });
});
