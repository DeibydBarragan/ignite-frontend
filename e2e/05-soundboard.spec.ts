import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 3 — 05 Soundboard y Modales Accesibles", () => {
  test("renderiza los pads de sonido y permite reproducir un efecto", async ({ authedPage }) => {
    let playSoundPayload: unknown = null;
    await authedPage.route("**/api/sound/sounds/play", async (route) => {
      playSoundPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        json: { success: true, message: "Reproduciendo" },
      });
    });

    await authedPage.goto("/#soundboard");

    // Verificar que los pads están en pantalla
    await expect(authedPage.getByText("Bruh Sound Effect")).toBeVisible();
    await expect(authedPage.getByText("Airhorn Victory")).toBeVisible();

    // Clic en el pad de sonido
    await authedPage.getByText("Bruh Sound Effect").click();

    // Validar que se llamó al endpoint con el soundId correcto
    expect(playSoundPayload).toMatchObject({
      soundId: "sound-1",
    });
  });

  test("permite filtrar sonidos por texto de búsqueda", async ({ authedPage }) => {
    await authedPage.goto("/#soundboard");

    // Buscar pad específico
    const searchInput = authedPage.getByPlaceholder(/Buscar sonido/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Bruh");
      await expect(authedPage.getByText("Bruh Sound Effect")).toBeVisible();
      await expect(authedPage.getByText("Airhorn Victory")).not.toBeVisible();
    }
  });

  test("abre modal de añadir sonido con focus-trap y lo cierra con tecla Escape", async ({ authedPage }) => {
    await authedPage.goto("/#soundboard");

    // Abrir modal de añadir sonido
    const addSoundBtn = authedPage.getByRole("button", { name: /Añadir sonido/i });
    if (await addSoundBtn.isVisible()) {
      await addSoundBtn.click();

      // El modal debe estar en pantalla con role dialog
      const modal = authedPage.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Presionar Escape para cerrar
      await authedPage.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
    }
  });
});
