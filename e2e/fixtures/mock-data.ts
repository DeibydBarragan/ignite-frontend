export const MOCK_USER = {
  id: "123456789012345678",
  username: "TestDiscordUser",
  displayName: "Tester",
  avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
  avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
};

export const MOCK_GUILDS = [
  {
    id: "987654321098765432",
    name: "Servidor Principal Test",
    icon: null,
    memberCount: 42,
  },
];

export const MOCK_VOICE_CHANNELS = [
  {
    id: "vc-1",
    name: "Canal General",
    bitrate: 64000,
    userLimit: 0,
    userCount: 3,
    botPresent: true,
    members: [],
  },
];

export const MOCK_VOICE_STATUS = {
  bot: { id: "vc-1", name: "Canal General" },
  user: { id: "vc-1", name: "Canal General" },
  canControl: true,
};

export const MOCK_SONGS = [
  {
    id: "song-1",
    title: "Cyberpunk City Drive",
    artist: "Synthwave Master",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: 215,
    formattedDuration: "3:35",
    source: "youtube" as const,
    category: "synthwave" as const,
  },
  {
    id: "song-2",
    title: "Lo-Fi Beats to Relax",
    artist: "Chillhop Music",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    duration: 180,
    formattedDuration: "3:00",
    source: "youtube" as const,
    category: "lofi" as const,
  },
];

export const MOCK_SOUNDS = [
  {
    id: "sound-1",
    name: "Bruh Sound Effect",
    emoji: "🗿",
    category: "memes",
    duration: 1.2,
    playsCount: 15,
    hasFile: true,
    uploadedBy: null,
  },
  {
    id: "sound-2",
    name: "Airhorn Victory",
    emoji: "📢",
    category: "gaming",
    duration: 2.5,
    playsCount: 8,
    hasFile: true,
    uploadedBy: null,
  },
];

export const MOCK_PHRASES = [
  {
    id: "phrase-1",
    text: "Hola a todos en el canal de voz",
    voice: "es-ES-AlvaroNeural",
    createdAt: new Date().toISOString(),
  },
];
