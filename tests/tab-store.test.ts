// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTabSnapshot,
  setActiveTab,
  subscribeTab,
} from "@/lib/tab-store";
import { STORAGE_KEYS } from "@/lib/storage-keys";

function resetUrl() {
  window.history.replaceState(null, "", "/");
}

beforeEach(() => {
  window.localStorage.clear();
  resetUrl();
});

describe("getTabSnapshot", () => {
  it("prioriza el hash de la URL", () => {
    window.history.replaceState(null, "", "/#soundboard");
    window.localStorage.setItem(STORAGE_KEYS.activeTab, "tts");
    expect(getTabSnapshot()).toBe("soundboard");
  });

  it("usa el query param si el hash no es válido", () => {
    window.history.replaceState(null, "", "/?tab=tts");
    expect(getTabSnapshot()).toBe("tts");
  });

  it("cae a localStorage", () => {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, "soundboard");
    expect(getTabSnapshot()).toBe("soundboard");
  });

  it("usa music como default", () => {
    expect(getTabSnapshot()).toBe("music");
  });

  it("ignora valores inválidos", () => {
    window.history.replaceState(null, "", "/#hack");
    window.localStorage.setItem(STORAGE_KEYS.activeTab, "hack");
    expect(getTabSnapshot()).toBe("music");
  });
});

describe("setActiveTab", () => {
  it("persiste, actualiza la URL y notifica a los suscriptores", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTab(listener);

    setActiveTab("soundboard");

    expect(window.localStorage.getItem(STORAGE_KEYS.activeTab)).toBe("soundboard");
    expect(window.location.hash).toBe("#soundboard");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("deja de notificar tras unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTab(listener);
    unsubscribe();

    setActiveTab("tts");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("subscribeTab", () => {
  it("reacciona a hashchange del navegador", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTab(listener);

    window.history.replaceState(null, "", "/#soundboard");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
