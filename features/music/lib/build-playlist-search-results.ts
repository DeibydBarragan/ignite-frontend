import type { PlaylistSearchResult, UserPlaylist } from "@/types/domain";

export interface PlaylistSearchResults {
  /** Playlists guardadas del usuario que coinciden con la búsqueda */
  userPlaylists: UserPlaylist[];
  /** Playlists públicas de YouTube */
  youtubePlaylists: UserPlaylist[];
  /** Lista combinada para paginación (primero guardadas, luego YouTube) */
  combined: UserPlaylist[];
}

export function extractPlaylistKey(url: string): string {
  try {
    const parsed = new URL(url);
    const list = parsed.searchParams.get("list");
    if (list) return `list:${list}`;
  } catch {
    // Si no es URL absoluta válida, seguir al fallback
  }
  return url.trim().toLowerCase();
}

function matchesQuery(playlist: UserPlaylist, query: string): boolean {
  if (playlist.name.toLowerCase().includes(query)) return true;
  if (playlist.source.toLowerCase().includes(query)) return true;
  if (playlist.uploader && playlist.uploader.toLowerCase().includes(query)) return true;
  return playlist.tracks.some(
    (t) => t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query)
  );
}

/**
 * Combina las playlists guardadas del usuario con los resultados públicos de YouTube.
 * Si una playlist de YouTube ya está guardada en la colección del usuario,
 * se muestra una sola vez en el grupo de guardadas.
 */
export function buildPlaylistSearchResults(input: {
  query: string;
  userPlaylists: UserPlaylist[];
  youtubePlaylists: PlaylistSearchResult[];
}): PlaylistSearchResults {
  const query = input.query.trim().toLowerCase();

  const userPlaylists: UserPlaylist[] = [];
  if (query) {
    for (const pl of input.userPlaylists) {
      if (matchesQuery(pl, query)) {
        userPlaylists.push(pl);
      }
    }
  }

  const savedUrlKeys = new Set(input.userPlaylists.map((p) => extractPlaylistKey(p.url)));
  const savedIds = new Set(input.userPlaylists.map((p) => p.id));

  const youtubePlaylists: UserPlaylist[] = [];
  for (const yt of input.youtubePlaylists) {
    const key = extractPlaylistKey(yt.url);

    // Si ya está guardada en la colección del usuario, se prioriza la guardada
    if (savedUrlKeys.has(key) || savedIds.has(yt.id)) {
      const existing = input.userPlaylists.find(
        (p) => extractPlaylistKey(p.url) === key || p.id === yt.id
      );
      if (existing && !userPlaylists.some((p) => p.id === existing.id)) {
        userPlaylists.push(existing);
      }
      continue;
    }

    youtubePlaylists.push({
      id: yt.id,
      name: yt.name || yt.title,
      url: yt.url,
      cover: yt.cover || yt.thumbnail,
      source: "youtube",
      tracks: [],
      trackCount: yt.trackCount,
      uploader: yt.uploader || yt.author,
      synced_at: null,
    });
  }

  // Priorizar lista oficial "Presenting / Presentamos a" de YouTube Music como primer resultado público
  const cleanArtist = query.replace(/^(this\s+is|presenting|presentamos\s+a|presentando\s+a)\s+/i, "").trim();
  if (cleanArtist.length >= 2) {
    const isPresentingTitle = (t: string) => /^(presenting|presentamos a|presentando a)\b/i.test(t);
    const presIdx = youtubePlaylists.findIndex(
      (p) =>
        (p.uploader === "YouTube Music" || p.id.startsWith("RDCL")) &&
        p.name.toLowerCase().includes(cleanArtist) &&
        isPresentingTitle(p.name)
    );
    if (presIdx > 0) {
      const [pres] = youtubePlaylists.splice(presIdx, 1);
      youtubePlaylists.unshift(pres);
    }
  }

  return {
    userPlaylists,
    youtubePlaylists,
    combined: [...userPlaylists, ...youtubePlaylists],
  };
}
