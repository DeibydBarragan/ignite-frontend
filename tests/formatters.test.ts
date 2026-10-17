import { describe, expect, it } from "vitest";
import {
  derivePlaylistName,
  detectPlatform,
  detectPlaylistSource,
  formatDuration,
  formatRelativeTime,
  timeAgo,
} from "@/lib/formatters";

describe("formatDuration", () => {
  it("formatea segundos a m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(185)).toBe("3:05");
  });

  it("sanea valores inválidos", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
    expect(formatDuration(61.9)).toBe("1:01");
  });
});

describe("formatRelativeTime", () => {
  it("devuelve null sin timestamp", () => {
    expect(formatRelativeTime(null)).toBeNull();
    expect(formatRelativeTime(undefined)).toBeNull();
  });

  it("describe tiempos recientes", () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe("ahora mismo");
    expect(formatRelativeTime(now - 30_000)).toBe("hace 30 s");
    expect(formatRelativeTime(now - 5 * 60_000)).toBe("hace 5 min");
    expect(formatRelativeTime(now - 3 * 3600_000)).toBe("hace 3 h");
  });
});

describe("timeAgo", () => {
  it("maneja fechas ausentes o inválidas", () => {
    expect(timeAgo(null)).toBe("nunca sincronizada");
    expect(timeAgo("no-es-fecha")).toBe("nunca sincronizada");
  });

  it("describe fechas recientes", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("actualizada ahora mismo");
  });
});

describe("detectPlatform", () => {
  it("detecta spotify y youtube", () => {
    expect(detectPlatform("https://open.spotify.com/track/abc")).toBe("spotify");
    expect(detectPlatform("https://youtu.be/abc")).toBe("youtube");
    expect(detectPlatform("https://music.youtube.com/watch?v=abc")).toBe("youtube");
    expect(detectPlatform("https://example.com/abc")).toBeNull();
  });
});

describe("detectPlaylistSource", () => {
  it("infiere la fuente y usa spotify como fallback", () => {
    expect(detectPlaylistSource("https://open.spotify.com/playlist/1")).toBe("spotify");
    expect(detectPlaylistSource("https://www.youtube.com/playlist?list=1")).toBe("youtube");
    expect(detectPlaylistSource("https://desconocido.dev/x")).toBe("spotify");
  });
});

describe("derivePlaylistName", () => {
  it("prioriza el nombre personalizado", () => {
    expect(derivePlaylistName("https://open.spotify.com/playlist/abc", "  Mi lista  ")).toBe("Mi lista");
  });

  it("deriva del path URL", () => {
    expect(derivePlaylistName("https://open.spotify.com/playlist/mi_playlist-favorita")).toBe(
      "mi playlist favorita"
    );
  });

  it("usa fallback para URLs inválidas", () => {
    expect(derivePlaylistName("no-es-url")).toBe("Nueva playlist");
  });
});
