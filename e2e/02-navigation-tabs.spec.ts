import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 1 — 02 Navegación y Sincronización de Pestañas", () => {
  test("permite alternar entre las tres pestañas y sincroniza el hash URL", async ({ authedPage }) => {
    await authedPage.goto("/");

    // Pestaña inicial por defecto: Música
    await expect(authedPage.getByRole("tab", { name: /Música/i })).toBeVisible();

    // 1. Cambiar a Voz & TTS
    await authedPage.getByRole("tab", { name: /Voz & TTS/i }).click();
    await expect(authedPage).toHaveURL(/#tts/);

    // 2. Cambiar a Soundboard
    await authedPage.getByRole("tab", { name: /Soundboard/i }).click();
    await expect(authedPage).toHaveURL(/#soundboard/);

    // 3. Regresar a Música
    await authedPage.getByRole("tab", { name: /Música/i }).click();
    await expect(authedPage).toHaveURL(/#music/);
  });

  test("restaura la pestaña activa al cargar directamente con hash en la URL", async ({ authedPage }) => {
    await authedPage.goto("/#soundboard");

    // Debe cargar directamente en la pestaña de soundboard
    await expect(authedPage).toHaveURL(/#soundboard/);
    const soundboardTab = authedPage.getByRole("tab", { name: /Soundboard/i });
    await expect(soundboardTab).toBeVisible();
  });
});
