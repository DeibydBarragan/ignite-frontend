import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 4 — 07 Resiliencia ante Errores de Red", () => {
  test("muestra estado Offline de forma controlada cuando el healthcheck falla", async ({ authedPage }) => {
    // Forzar fallo 500 en servicio de música
    await authedPage.route("**/api/music/health", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Bot internal error" } });
    });
    await authedPage.route("**/api/music/**/player", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Bot internal error" } });
    });

    await authedPage.goto("/#music");

    // Debe mostrar indicador Offline sin romper la interfaz
    await expect(authedPage.getByText(/Música Offline/i)).toBeVisible();
    await expect(authedPage.getByRole("tab", { name: /Música/i })).toBeVisible();
  });

  test("se recupera dinámicamente cuando el servicio vuelve a estar online", async ({ authedPage }) => {
    let isHealthy = false;

    await authedPage.route("**/api/music/health", async (route) => {
      if (isHealthy) {
        await route.fulfill({
          status: 200,
          json: { status: "ok", uptime: 500, bot: { username: "IgniteBot" } },
        });
      } else {
        await route.fulfill({ status: 500, json: { error: "Down" } });
      }
    });

    await authedPage.route("**/api/music/**/player", async (route) => {
      if (isHealthy) {
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
      } else {
        await route.fulfill({ status: 500, json: { error: "Down" } });
      }
    });

    await authedPage.goto("/#music");
    await expect(authedPage.getByText(/Música Offline/i)).toBeVisible();

    // Restaurar salud del bot
    isHealthy = true;
    await authedPage.reload();
    await expect(authedPage.getByText(/Música Online/i)).toBeVisible();
  });
});
