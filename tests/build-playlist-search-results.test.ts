import { describe, expect, it } from "vitest";
import {
  buildPlaylistSearchResults,
  extractPlaylistKey,
} from "@/features/music/lib/build-playlist-search-results";
import type { PlaylistSearchResult, UserPlaylist, Song } from "@/types/domain";

function sampleSong(title: string, artist = "Artista"): Song {
  return {
    id: `s-${title}`,
    title,
    artist,
    albumArt: "",
    duration: 180,
    source: "youtube",
    url: `https://youtube.com/watch?v=123`,
  } as Song;
}

const savedPlaylists: UserPlaylist[] = [
  {
    id: "pl-1",
    name: "Reggaeton 2026",
    source: "youtube",
    url: "https://www.youtube.com/playlist?list=PL111",
    cover: "https://img.youtube.com/1.jpg",
    tracks: [sampleSong("Tití Me Preguntó", "Bad Bunny")],
    synced_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "pl-2",
    name: "Rock Clásico",
    source: "spotify",
    url: "https://open.spotify.com/playlist/37i9dQZF1DXcF6B6Qrigxm",
    cover: "https://spotify.com/2.jpg",
    tracks: [sampleSong("Bohemian Rhapsody", "Queen")],
    synced_at: "2026-01-01T00:00:00Z",
  },
];

const youtubeResults: PlaylistSearchResult[] = [
  {
    id: "PL111", // Mismo id/list que pl-1
    title: "Reggaeton 2026 Oficial",
    name: "Reggaeton 2026 Oficial",
    url: "https://youtube.com/playlist?list=PL111",
    thumbnail: "https://img.youtube.com/1_new.jpg",
    cover: "https://img.youtube.com/1_new.jpg",
    trackCount: 40,
    uploader: "Canal Oficial",
    author: "Canal Oficial",
    source: "youtube",
  },
  {
    id: "PL222",
    title: "Reggaeton Viejito",
    name: "Reggaeton Viejito",
    url: "https://www.youtube.com/playlist?list=PL222",
    thumbnail: "https://img.youtube.com/2.jpg",
    cover: "https://img.youtube.com/2.jpg",
    trackCount: 25,
    uploader: "DJ Mix",
    author: "DJ Mix",
    source: "youtube",
  },
];

describe("buildPlaylistSearchResults", () => {
  it("extrae la clave de playlist de YouTube por parámetro list", () => {
    expect(extractPlaylistKey("https://www.youtube.com/playlist?list=PL12345")).toBe("list:PL12345");
    expect(extractPlaylistKey("https://youtube.com/playlist?feature=shared&list=PL12345")).toBe("list:PL12345");
    expect(extractPlaylistKey("https://open.spotify.com/playlist/abc")).toBe("https://open.spotify.com/playlist/abc");
  });

  it("filtra playlists guardadas por nombre o canción", () => {
    const res = buildPlaylistSearchResults({
      query: "reggaeton",
      userPlaylists: savedPlaylists,
      youtubePlaylists: [],
    });
    expect(res.userPlaylists).toHaveLength(1);
    expect(res.userPlaylists[0].id).toBe("pl-1");

    const byTrack = buildPlaylistSearchResults({
      query: "queen",
      userPlaylists: savedPlaylists,
      youtubePlaylists: [],
    });
    expect(byTrack.userPlaylists).toHaveLength(1);
    expect(byTrack.userPlaylists[0].id).toBe("pl-2");
  });

  it("deduplica si una playlist de YouTube ya está guardada en la colección", () => {
    const res = buildPlaylistSearchResults({
      query: "reggaeton",
      userPlaylists: savedPlaylists,
      youtubePlaylists: youtubeResults,
    });

    // pl-1 estaba guardada y youtubeResults[0] tiene la misma list=PL111
    // Debe aparecer una sola vez en userPlaylists y ninguna en youtubePlaylists
    expect(res.userPlaylists.map((p) => p.id)).toContain("pl-1");
    expect(res.youtubePlaylists.some((p) => p.id === "PL111")).toBe(false);
    expect(res.youtubePlaylists.map((p) => p.id)).toEqual(["PL222"]);
    expect(res.combined).toHaveLength(2);
  });

  it("formatea los resultados de YouTube con los campos requeridos para PlaylistCard", () => {
    const res = buildPlaylistSearchResults({
      query: "viejito",
      userPlaylists: [],
      youtubePlaylists: [youtubeResults[1]],
    });

    expect(res.youtubePlaylists).toHaveLength(1);
    const item = res.youtubePlaylists[0];
    expect(item.id).toBe("PL222");
    expect(item.name).toBe("Reggaeton Viejito");
    expect(item.trackCount).toBe(25);
    expect(item.uploader).toBe("DJ Mix");
    expect(item.source).toBe("youtube");
  });
});
