import { describe, expect, it } from "vitest";
import {
  apiVoiceStatusSchema,
  controlResponseSchema,
  playResponseSchema,
  songSchema,
} from "@/lib/schemas";

const validSong = {
  id: "s-1",
  title: "Tema",
  artist: "Artista",
  albumArt: "https://img/cover.png",
  duration: 185,
  source: "youtube",
  url: "https://youtu.be/x",
  category: "hits",
};

describe("songSchema", () => {
  it("valida una canción completa", () => {
    expect(songSchema.safeParse(validSong).success).toBe(true);
  });

  it("acepta trackId de la cola del bot", () => {
    const res = songSchema.safeParse({ ...validSong, trackId: "t-1", requestedBy: null });
    expect(res.success).toBe(true);
  });

  it("rechaza fuente desconocida", () => {
    expect(songSchema.safeParse({ ...validSong, source: "soundcloud" }).success).toBe(false);
  });

  it("rechaza duración negativa", () => {
    expect(songSchema.safeParse({ ...validSong, duration: -1 }).success).toBe(false);
  });

  it("acepta requestedBy nullable", () => {
    const res = songSchema.safeParse({
      ...validSong,
      requestedBy: { id: "u", username: "u", avatar: null },
    });
    expect(res.success).toBe(true);
  });
});

describe("apiVoiceStatusSchema", () => {
  it("valida estados con y sin bot", () => {
    expect(
      apiVoiceStatusSchema.safeParse({
        bot: { id: "b", name: "Bot" },
        user: null,
        canControl: true,
      }).success
    ).toBe(true);
    expect(apiVoiceStatusSchema.safeParse({ bot: null, user: null, canControl: false }).success).toBe(
      true
    );
  });
});

describe("playResponseSchema", () => {
  it("acepta éxito con canción y playlist", () => {
    const res = playResponseSchema.safeParse({
      success: true,
      song: validSong,
      playlist: { name: "Lista", count: 12 },
    });
    expect(res.success).toBe(true);
  });

  it("acepta error sin canción", () => {
    expect(playResponseSchema.safeParse({ success: false, error: "nope" }).success).toBe(true);
  });

  it("acepta song/playlist null del bot", () => {
    const res = playResponseSchema.safeParse({
      success: true,
      started: true,
      position: 0,
      song: null,
      playlist: null,
    });
    expect(res.success).toBe(true);
  });
});

describe("controlResponseSchema", () => {
  it("acepta mensajes opcionales", () => {
    expect(controlResponseSchema.safeParse({ success: true }).success).toBe(true);
    expect(controlResponseSchema.safeParse({ success: false, error: "boom" }).success).toBe(true);
  });
});
