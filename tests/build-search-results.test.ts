import { describe, expect, it } from "vitest";
import { buildSearchResults } from "@/features/music/lib/build-search-results";
import type { Song } from "@/types/domain";

function song(id: string, title: string, artist = "Artista", source: Song["source"] = "youtube"): Song {
  return {
    id,
    title,
    artist,
    albumArt: "",
    duration: 200,
    source,
    url: `https://youtube.com/watch?v=${id}`,
    category: "hits",
  } as Song;
}

const favorites = [
  song("f1", "Tití Me Preguntó", "Bad Bunny"),
  song("f2", "Starboy", "The Weeknd"),
  song("f3", "Me Porto Bonito", "Bad Bunny"),
];

const youtube = [
  song("y1", "Ojitos Lindos", "Bad Bunny"),
  song("f1", "Tití Me Preguntó", "Bad Bunny"), // ya es favorita
  song("y2", "Moscow Mule", "Bad Bunny"),
];

describe("buildSearchResults", () => {
  it("en 'todo' pone primero las favoritas y después YouTube", () => {
    const r = buildSearchResults({ query: "bad bunny", scope: "all", favorites, youtube });
    expect(r.combined.map((s) => s.id)).toEqual(["f1", "f3", "y1", "y2"]);
    expect(r.favorites.map((s) => s.id)).toEqual(["f1", "f3"]);
    expect(r.youtube.map((s) => s.id)).toEqual(["y1", "y2"]);
  });

  it("una canción que está en las dos listas sale una sola vez, como favorita", () => {
    const r = buildSearchResults({ query: "bad bunny", scope: "all", favorites, youtube });
    const ids = r.combined.map((s) => s.id);
    expect(ids.filter((id) => id === "f1")).toHaveLength(1);
    expect(r.favorites.some((s) => s.id === "f1")).toBe(true);
    expect(r.youtube.some((s) => s.id === "f1")).toBe(false);
  });

  it("un resultado de YouTube que es favorita pasa al grupo de favoritas aunque el texto no coincida", () => {
    const r = buildSearchResults({
      query: "perreo",
      scope: "all",
      favorites,
      youtube: [song("f2", "Otro titulo distinto", "Otro"), song("y9", "Perreo Intenso")],
    });
    expect(r.favorites.map((s) => s.id)).toEqual(["f2"]);
    expect(r.youtube.map((s) => s.id)).toEqual(["y9"]);
    expect(r.combined.map((s) => s.id)).toEqual(["f2", "y9"]);
  });

  it("en 'favoritos' solo muestra las favoritas que coinciden", () => {
    const r = buildSearchResults({ query: "weeknd", scope: "favorites", favorites, youtube });
    expect(r.combined.map((s) => s.id)).toEqual(["f2"]);
    expect(r.youtube).toEqual([]);
  });

  it("en 'youtube' solo muestra YouTube, sin repetidos", () => {
    const r = buildSearchResults({
      query: "bad bunny",
      scope: "youtube",
      favorites,
      youtube: [...youtube, youtube[0]],
    });
    expect(r.combined.map((s) => s.id)).toEqual(["y1", "f1", "y2"]);
    expect(r.favorites).toEqual([]);
  });

  it("compara sin importar mayúsculas y también por artista y fuente", () => {
    const r = buildSearchResults({ query: "THE WEEKND", scope: "favorites", favorites, youtube: [] });
    expect(r.combined.map((s) => s.id)).toEqual(["f2"]);
    const bySource = buildSearchResults({ query: "youtube", scope: "favorites", favorites, youtube: [] });
    expect(bySource.combined).toHaveLength(3);
  });

  it("sin texto no devuelve favoritas", () => {
    const r = buildSearchResults({ query: "   ", scope: "all", favorites, youtube: [] });
    expect(r.combined).toEqual([]);
  });

  it("detecta la misma canción por url aunque cambie el id", () => {
    const sameUrl = { ...song("otro-id", "Starboy", "The Weeknd"), url: favorites[1].url };
    const r = buildSearchResults({ query: "starboy", scope: "all", favorites, youtube: [sameUrl] });
    expect(r.combined).toHaveLength(1);
    expect(r.favorites[0].id).toBe("f2");
  });

  it("en 'playlists' no devuelve canciones de favoritos ni youtube de canciones", () => {
    const r = buildSearchResults({ query: "bad bunny", scope: "playlists", favorites, youtube });
    expect(r.combined).toEqual([]);
    expect(r.favorites).toEqual([]);
    expect(r.youtube).toEqual([]);
  });
});
