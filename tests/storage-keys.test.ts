// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS, favPlaylistsKey, migrateLegacyKeys } from "@/lib/storage-keys";

beforeEach(() => {
  window.localStorage.clear();
});

describe("migrateLegacyKeys", () => {
  it("copia claves legacy a las claves versionadas", () => {
    window.localStorage.setItem("ignite_active_tab", "soundboard");
    migrateLegacyKeys();
    expect(window.localStorage.getItem(STORAGE_KEYS.activeTab)).toBe("soundboard");
  });

  it("no sobrescribe valores ya migrados", () => {
    window.localStorage.setItem("ignite_active_tab", "legacy");
    window.localStorage.setItem(STORAGE_KEYS.activeTab, "music");
    migrateLegacyKeys();
    expect(window.localStorage.getItem(STORAGE_KEYS.activeTab)).toBe("music");
  });

  it("ignora claves legacy ausentes", () => {
    migrateLegacyKeys();
    expect(window.localStorage.getItem(STORAGE_KEYS.activeTab)).toBeNull();
  });
});

describe("favPlaylistsKey", () => {
  it("usa el id de usuario cuando existe", () => {
    expect(favPlaylistsKey("u-1")).toBe(`${STORAGE_KEYS.favPlaylistsPrefix}u-1`);
  });

  it("usa guest como fallback", () => {
    expect(favPlaylistsKey(null)).toBe(`${STORAGE_KEYS.favPlaylistsPrefix}guest`);
    expect(favPlaylistsKey(undefined)).toBe(`${STORAGE_KEYS.favPlaylistsPrefix}guest`);
  });
});
