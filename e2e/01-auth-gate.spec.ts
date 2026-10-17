import { test as baseTest, expect } from "@playwright/test";
import { setupMocks, test } from "./fixtures/auth.fixture";

baseTest.describe("Fase 1 — 01 Auth Gate & SSR", () => {
  baseTest("muestra el AuthWall restrictivo cuando el usuario es anónimo", async ({ page }) => {
    await setupMocks(page, { authenticated: false });
    await page.goto("/");

    // El AuthWall debe estar visible con el botón de Discord
    await expect(page.getByText("Acceso Restringido")).toBeVisible();
    await expect(page.getByRole("button", { name: /Conectar con Discord/i })).toBeVisible();

    // No debe mostrar la barra de navegación de la app ni el reproductor
    await expect(page.getByRole("tab", { name: /Música/i })).not.toBeVisible();
  });

  test("renderiza el Dashboard directamente cuando el usuario está autenticado", async ({ authedPage }) => {
    await authedPage.goto("/");

    // El Dashboard debe ser visible
    await expect(authedPage.getByRole("tab", { name: /Música/i })).toBeVisible();
    await expect(authedPage.getByRole("tab", { name: /Voz & TTS/i })).toBeVisible();
    await expect(authedPage.getByRole("tab", { name: /Soundboard/i })).toBeVisible();

    // El AuthWall no debe estar presente
    await expect(authedPage.getByText("Acceso Restringido")).not.toBeVisible();
  });
});
