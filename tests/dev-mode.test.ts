// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDevModeStore } from "@/features/auth/hooks/use-dev-mode";

const STORAGE_KEY = "ignite_dev_mode_active";

describe("Dev Mode Store & Voice Tab Integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDevModeStore.getState().setDevMode(false);
  });

  it("inicia con isDevMode en false por defecto", () => {
    expect(useDevModeStore.getState().isDevMode).toBe(false);
  });

  it("actualiza isDevMode y persiste en localStorage", () => {
    useDevModeStore.getState().setDevMode(true);
    expect(useDevModeStore.getState().isDevMode).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    useDevModeStore.getState().setDevMode(false);
    expect(useDevModeStore.getState().isDevMode).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("determina visibilidad de la pestaña voice según isDevMode y activeTab", () => {
    const shouldShowVoiceTab = (isDevMode: boolean, activeTab: string) =>
      isDevMode || activeTab === "voice";

    // Con dev mode inactivo y pestaña de música -> no visible
    expect(shouldShowVoiceTab(false, "music")).toBe(false);
    expect(shouldShowVoiceTab(false, "soundboard")).toBe(false);
    expect(shouldShowVoiceTab(false, "tts")).toBe(false);

    // Con dev mode activo -> siempre visible en cualquier pestaña
    expect(shouldShowVoiceTab(true, "music")).toBe(true);
    expect(shouldShowVoiceTab(true, "soundboard")).toBe(true);
    expect(shouldShowVoiceTab(true, "tts")).toBe(true);
    expect(shouldShowVoiceTab(true, "voice")).toBe(true);

    // Con dev mode inactivo pero accediendo vía URL direct /#voice -> visible
    expect(shouldShowVoiceTab(false, "voice")).toBe(true);
  });
});
