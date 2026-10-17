import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 2 — 03 Catálogo de Música y Búsqueda", () => {
  test("permite buscar canciones y muestra los resultados en el catálogo", async ({ authedPage }) => {
    await authedPage.goto("/#music");

    // Conmutar a la pestaña de Recomendadas para cargar el catálogo
    const recTab = authedPage.getByRole("button", { name: /^Recomendadas/i });
    await expect(recTab).toBeVisible();
    await recTab.click();

    // Verificar campo de búsqueda
    const searchInput = authedPage.getByPlaceholder(
      "Buscar canción, artista o pegar enlace de YouTube / Spotify..."
    );
    await expect(searchInput).toBeVisible();

    // Escribir consulta de búsqueda
    await searchInput.fill("Cyberpunk");

    // El catálogo debe mostrar la tarjeta de la canción filtrada
    await expect(authedPage.getByText("Cyberpunk City Drive").first()).toBeVisible();
    await expect(authedPage.getByText("Synthwave Master").first()).toBeVisible();
  });

  test("permite conmutar entre las subpestañas del catálogo", async ({ authedPage }) => {
    await authedPage.goto("/#music");

    // Conmutar a Recomendadas
    const recTab = authedPage.getByRole("button", { name: /^Recomendadas/i });
    await expect(recTab).toBeVisible();
    await recTab.click();
    await expect(recTab).toHaveClass(/glass-pill-active/);

    // Conmutar a Playlists
    const playlistsTab = authedPage.getByRole("button", { name: /^Playlists/i });
    await expect(playlistsTab).toBeVisible();
    await playlistsTab.click();
    await expect(playlistsTab).toHaveClass(/glass-pill-active/);

    // Conmutar a Favoritos
    const favTab = authedPage.getByRole("button", { name: /Favoritos/i });
    await expect(favTab).toBeVisible();
    await favTab.click();
    await expect(favTab).toHaveClass(/glass-pill-active/);
  });
});
