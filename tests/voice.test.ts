import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchGuildVoiceSettings,
  updateGuildVoiceSettings,
  resetGuildVoiceSettings,
} from "@/features/voice/services/voice-service";
import { VOICE_COMMANDS } from "@/features/voice/types/voice-types";

describe("Voice Types & Definitions", () => {
  it("contiene los 10 comandos esperados con sus plantillas por defecto", () => {
    expect(VOICE_COMMANDS).toHaveLength(10);
    const ids = VOICE_COMMANDS.map((c) => c.id);
    expect(ids).toContain("play");
    expect(ids).toContain("enqueue");
    expect(ids).toContain("skip");
    expect(ids).toContain("pause");
    expect(ids).toContain("resume");
    expect(ids).toContain("stop");
    expect(ids).toContain("previous");
    expect(ids).toContain("shuffle");
    expect(ids).toContain("volume");
    expect(ids).toContain("queue");
  });

  it("los comandos con parámetros tienen placeholders asignados", () => {
    const playCmd = VOICE_COMMANDS.find((c) => c.id === "play");
    expect(playCmd?.requiresParam).toBe(true);
    expect(playCmd?.paramPlaceholder).toBeDefined();

    const skipCmd = VOICE_COMMANDS.find((c) => c.id === "skip");
    expect(skipCmd?.requiresParam).toBe(false);
  });
});

describe("Voice Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSettings = {
    enabled: true,
    wake_word: "ignite",
    language: "es",
    tts_feedback_enabled: true,
    tts_templates: { play: "Reproduciendo {query}" },
    bindings: [{ phrase: "reproduce", command_id: "play" }],
  };

  it("fetchGuildVoiceSettings parsea la respuesta exitosa", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSettings), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await fetchGuildVoiceSettings("guild-123");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.wake_word).toBe("ignite");
      expect(res.data.bindings[0].phrase).toBe("reproduce");
    }
  });

  it("updateGuildVoiceSettings envía PUT con la carga útil", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSettings), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await updateGuildVoiceSettings("guild-123", { wake_word: "bot" });
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/music/guilds/guild-123/voice"),
      expect.objectContaining({
        method: "PUT",
      })
    );
  });

  it("resetGuildVoiceSettings envía POST al endpoint de reset", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSettings), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await resetGuildVoiceSettings("guild-123");
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/music/guilds/guild-123/voice/reset"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
