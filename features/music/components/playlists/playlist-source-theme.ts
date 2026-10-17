const SOURCE_THEMES: Record<string, { label: string; badge: string; dot: string }> = {
  spotify: {
    label: "Spotify",
    badge: "bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/40",
    dot: "bg-[#1ed760]",
  },
  youtube: {
    label: "YouTube",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    dot: "bg-red-500",
  },
};

/** Tema visual (label + clases) según la plataforma de origen de la playlist. */
export function playlistSourceTheme(source: string) {
  const key = (source || "").toLowerCase();
  return (
    SOURCE_THEMES[key] || {
      label: source || "Playlist",
      badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      dot: "bg-purple-400",
    }
  );
}
