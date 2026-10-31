import { test, expect } from "./fixtures/auth.fixture";
import { MOCK_SONGS } from "./fixtures/mock-data";

/**
 * Fase 6 — El skeleton debe tener la forma del contenido que lo reemplaza.
 * Retardamos la respuesta de datos para capturar el skeleton en pantalla,
 * medimos el alto de su primera tarjeta, dejamos resolver y comparamos con
 * la primera tarjeta real. La tolerancia es 8 px.
 */
test.describe("Fase 6 — Skeletons con la forma del contenido", () => {
  const TOLERANCE = 8;

  test("la tarjeta skeleton de canción mide casi lo mismo que la real", async ({ authedPage }) => {
    let release: (() => void) | null = null;
    const gate = new Promise<void>((r) => (release = () => r()));

    // Las recomendaciones (radio/top) quedan en espera hasta que soltemos la puerta.
    await authedPage.route("**/recommendations**", async (route) => {
      await gate;
      await route.fulfill({
        status: 200,
        json: { source: "top", basedOn: null, songs: MOCK_SONGS },
      });
    });

    await authedPage.goto("/#music");

    // Mientras carga: la rejilla skeleton de canciones está presente.
    const skeletonGrid = authedPage.locator('[aria-label="Cargando canciones"]');
    await expect(skeletonGrid).toBeVisible();

    const skeletonCardHeight = await skeletonGrid
      .locator("> *")
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);

    // No debe haber un spinner de contenido encima del skeleton (una sola capa de carga).
    const contentSpinners = await authedPage.locator(".animate-spin").count();
    expect(contentSpinners).toBeLessThanOrEqual(0 + 3); // solo posibles spinners de botón

    // Soltamos los datos y esperamos el contenido real.
    release!();
    await expect(skeletonGrid).toBeHidden();

    const realCard = authedPage.getByRole("article").first();
    await expect(realCard).toBeVisible();
    const realCardHeight = await realCard.evaluate((el) => el.getBoundingClientRect().height);

    expect(Math.abs(skeletonCardHeight - realCardHeight)).toBeLessThanOrEqual(TOLERANCE);
  });

  test("el skeleton de pad mide casi lo mismo que el pad real", async ({ authedPage }) => {
    let release: (() => void) | null = null;
    const gate = new Promise<void>((r) => (release = () => r()));

    await authedPage.route("**/api/sound/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/sounds") && !url.includes("/play")) {
        await gate;
      }
      await route.fallback();
    });

    await authedPage.goto("/#soundboard");

    const skeletonGrid = authedPage.locator('[aria-label="Cargando sonidos"]');
    await expect(skeletonGrid).toBeVisible();

    const skeletonHeight = await skeletonGrid
      .locator("> *")
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);

    release!();
    await expect(skeletonGrid).toBeHidden();

    // El primer pad real es un botón dentro de la misma rejilla.
    const realPad = authedPage.locator("section button.glass-card").first();
    await expect(realPad).toBeVisible();
    const realHeight = await realPad.evaluate((el) => el.getBoundingClientRect().height);

    expect(Math.abs(skeletonHeight - realHeight)).toBeLessThanOrEqual(TOLERANCE);
  });
});
