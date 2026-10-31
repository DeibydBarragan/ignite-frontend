import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 5 — 08 Comandos de voz: pestañas y lista-detalle", () => {
  test.beforeEach(async ({ authedPage }) => {
    // "Comandos de Voz" is shown when the dashboard tab is "voice" (dev mode or an explicit URL).
    await authedPage.goto("/#voice");
    await expect(authedPage.getByRole("tab", { name: /Comandos de Voz/i })).toBeVisible();
  });

  test("navega entre las sub-pestañas de comandos de voz", async ({ authedPage }) => {
    const tablist = authedPage.getByRole("tablist", { name: /Secciones de comandos de voz/i });
    await expect(tablist).toBeVisible();

    // General es la pestaña inicial: wake words + confirmación hablada
    await expect(authedPage.getByRole("heading", { name: /Activación por Voz/i })).toBeVisible();
    await expect(authedPage.getByRole("heading", { name: /Confirmación Hablada/i })).toBeVisible();

    await authedPage.getByRole("tab", { name: /^Comandos$/ }).click();
    await expect(authedPage.getByRole("listbox", { name: /Comandos de voz/i })).toBeVisible();

    await authedPage.getByRole("tab", { name: /^General$/ }).click();
    await expect(authedPage.getByRole("heading", { name: /Activación por Voz/i })).toBeVisible();
  });

  test("selecciona un comando en la lista y edita su frase y su respuesta en el mismo lugar", async ({ authedPage }) => {
    await authedPage.getByRole("tab", { name: /^Comandos$/ }).click();

    // Elegir el comando "Pausar música" en la lista
    const listbox = authedPage.getByRole("listbox", { name: /Comandos de voz/i });
    await listbox.getByRole("option", { name: /Pausar música/i }).click();

    // El detalle muestra ese comando y su respuesta hablada juntos
    await expect(authedPage.getByText("ID: /pause")).toBeVisible();
    const replyInput = authedPage.locator('input[value="Música pausada"]');
    await expect(replyInput).toBeVisible();

    // Sin cambios, el botón Guardar del formulario no se muestra
    const detail = authedPage.getByRole("tabpanel", { name: /Comandos/i });
    await expect(detail.getByText(/Cambios sin guardar/i)).toHaveCount(0);

    // Añadir una frase personalizada: el botón Guardar aparece dentro del formulario
    const input = authedPage.getByPlaceholder("Añadir frase para /pause...");
    await input.fill("congela la musica");
    await input.press("Enter");
    await expect(authedPage.getByText(/congela la musica/)).toBeVisible();

    await expect(detail.getByText(/Cambios sin guardar/i)).toBeVisible();
    const formSave = detail.getByRole("button", { name: /^Guardar$/ });
    await expect(formSave).toBeEnabled();
    await formSave.click();
  });

  test("busca un comando y filtra la lista", async ({ authedPage }) => {
    await authedPage.getByRole("tab", { name: /^Comandos$/ }).click();

    const search = authedPage.getByPlaceholder("Buscar comando o frase...");
    await search.fill("volumen");

    const listbox = authedPage.getByRole("listbox", { name: /Comandos de voz/i });
    await expect(listbox.getByRole("option", { name: /Ajustar volumen/i })).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Pausar música/i })).toHaveCount(0);
  });
});
