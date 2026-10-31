import type { Song } from "@/types/domain";
import type { SearchScope } from "@/types/music";

export interface SearchResults {
  /** Favoritas que coinciden (y resultados de YouTube que ya eran favoritas). */
  favorites: Song[];
  /** Resultados de YouTube que no son favoritas. */
  youtube: Song[];
  /** Lista final, en el orden en que se muestra: primero favoritas, luego YouTube. */
  combined: Song[];
}

/** Dos canciones son la misma si comparten id o url. */
function sameSong(a: Song, b: Song): boolean {
  return a.id === b.id || (!!a.url && a.url === b.url);
}

function matchesQuery(song: Song, query: string): boolean {
  return (
    song.title.toLowerCase().includes(query) ||
    song.artist.toLowerCase().includes(query) ||
    song.source.toLowerCase().includes(query)
  );
}

function pushUnique(target: Song[], song: Song): void {
  if (!target.some((s) => sameSong(s, song))) target.push(song);
}

/**
 * Junta tus favoritas y los resultados de YouTube para la búsqueda.
 *
 * - `favorites`: solo tus favoritas que coinciden con el texto.
 * - `youtube`: solo los resultados de YouTube, tal como llegaron.
 * - `all`: primero las favoritas; después YouTube. Si una canción está en las dos
 *   listas sale una sola vez, como favorita.
 */
export function buildSearchResults(input: {
  query: string;
  scope: SearchScope;
  favorites: Song[];
  youtube: Song[];
}): SearchResults {
  const query = input.query.trim().toLowerCase();

  if (input.scope === "playlists") {
    return { favorites: [], youtube: [], combined: [] };
  }

  if (input.scope === "youtube") {
    const youtube: Song[] = [];
    for (const song of input.youtube) pushUnique(youtube, song);
    return { favorites: [], youtube, combined: youtube };
  }

  const favorites: Song[] = [];
  if (query) {
    for (const song of input.favorites) {
      if (matchesQuery(song, query)) pushUnique(favorites, song);
    }
  }

  if (input.scope === "favorites") {
    return { favorites, youtube: [], combined: favorites };
  }

  // scope "all": un resultado de YouTube que ya es favorita pasa al grupo de favoritas.
  const youtube: Song[] = [];
  for (const song of input.youtube) {
    if (input.favorites.some((fav) => sameSong(fav, song))) {
      const fav = input.favorites.find((f) => sameSong(f, song)) ?? song;
      pushUnique(favorites, fav);
    } else {
      pushUnique(youtube, song);
    }
  }

  return { favorites, youtube, combined: [...favorites, ...youtube] };
}
