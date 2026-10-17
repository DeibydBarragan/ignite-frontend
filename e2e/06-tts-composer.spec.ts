import { test, expect } from "./fixtures/auth.fixture";

test.describe("Fase 3 — 06 Compositor TTS y Voz", () => {
  test("permite redactar un mensaje TTS y enviarlo para emitir en Discord", async ({ authedPage }) => {
    let ttsPayload: unknown = null;
    await authedPage.route("**/api/sound/tts/speak", async (route) => {
      ttsPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        json: { success: true, message: "Emitido correctamente" },
      });
    });

    await authedPage.goto("/#tts");

    // Escribir mensaje en el compositor
    const textarea = authedPage.getByPlaceholder("Escribe el mensaje que dirá el bot en Discord...");
    await expect(textarea).toBeVisible();

    await textarea.fill("Mensaje de prueba para el canal de voz");

    // Contador de caracteres debe actualizarse
    await expect(authedPage.getByText(/caracteres restantes/i)).toBeVisible();

    // Botón de emisión debe estar habilitado
    const sendBtn = authedPage.getByRole("button", { name: /Emitir en Discord/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verificar que se invocó el endpoint con el texto ingresado
    expect(ttsPayload).toMatchObject({
      text: "Mensaje de prueba para el canal de voz",
    });
  });
});
