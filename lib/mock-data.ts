export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  status: "online" | "idle" | "dnd" | "offline";
  isVoiceConnected: boolean;
  currentChannelId: string | null;
}

export interface VoiceChannel {
  id: string;
  name: string;
  userCount: number;
  bitrate: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  botPresent: boolean;
  voiceChannels: VoiceChannel[];
}

export type MusicSource = "youtube" | "spotify" | "soundcloud";

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number; // in seconds
  source: MusicSource;
  url: string;
  category: "lofi" | "gaming" | "synthwave" | "hits" | "rock";
}

export type SoundCategory = "memes" | "gaming" | "reactions" | "sfx" | "anime";

export interface SoundItem {
  id: string;
  name: string;
  emoji?: string;
  category: SoundCategory;
  duration: number; // in seconds
  preset: "airhorn" | "violin" | "tada" | "badumtss" | "bruh" | "quack" | "alarm" | "levelup" | "victory" | "applause";
  playsCount: number;
  hasFile?: boolean; // true si el bot tiene el .mp3 real (suena en Discord)
}

export interface PhraseTrigger {
  id: string;
  phrase: string;
  soundId: string;
  soundName: string;
  soundEmoji?: string;
  exactMatch: boolean;
  enabled: boolean;
  channelTarget: "all" | string;
  triggerCount: number;
  lastTriggered?: string;
}

export interface TTSMessage {
  id: string;
  text: string;
  voice: string;
  pitch: number;
  rate: number;
  channelName: string;
  timestamp: string;
}

export interface LiveEvent {
  id: string;
  type: "voice_trigger" | "tts" | "music_play" | "soundboard";
  title: string;
  description: string;
  timestamp: string;
}

export const MOCK_USER: DiscordUser = {
  id: "48291049281749102",
  username: "AlexGamer",
  discriminator: "1337",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  status: "online",
  isVoiceConnected: true,
  currentChannelId: "vc-1",
};

export const MOCK_GUILDS: DiscordGuild[] = [
  {
    id: "guild-1",
    name: "Nexus Gaming HQ",
    icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    memberCount: 48,
    botPresent: true,
    voiceChannels: [
      { id: "vc-1", name: "General (Voz)", userCount: 4, bitrate: 64 },
      { id: "vc-2", name: "Squad Alpha", userCount: 2, bitrate: 96 },
      { id: "vc-3", name: "Música & Chill", userCount: 1, bitrate: 128 },
    ],
  },
  {
    id: "guild-2",
    name: "Code & Coffee Lab",
    icon: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=120&q=80",
    memberCount: 24,
    botPresent: true,
    voiceChannels: [
      { id: "vc-4", name: "Sala Principal", userCount: 0, bitrate: 64 },
      { id: "vc-5", name: "Focus Beats", userCount: 2, bitrate: 96 },
    ],
  },
  {
    id: "guild-3",
    name: "Anime Realm",
    icon: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=120&q=80",
    memberCount: 112,
    botPresent: true,
    voiceChannels: [
      { id: "vc-6", name: "Salón Otaku", userCount: 6, bitrate: 96 },
      { id: "vc-7", name: "Karaoke Stage", userCount: 3, bitrate: 128 },
    ],
  },
];

export const MOCK_SONGS: Song[] = [
  {
    id: "song-1",
    title: "Resonance",
    artist: "HOME",
    albumArt: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
    duration: 212,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=8GW6sLrK40k",
    category: "synthwave",
  },
  {
    id: "song-2",
    title: "Midnight City",
    artist: "M83",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    duration: 244,
    source: "spotify",
    url: "https://open.spotify.com/track/1eyzqe2QqGZUmfcPZtrIyt",
    category: "synthwave",
  },
  {
    id: "song-3",
    title: "Coffee Beats & Rain",
    artist: "Lofi Girl",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    duration: 178,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    category: "lofi",
  },
  {
    id: "song-4",
    title: "Snowfall",
    artist: "Øneheart & Reidenshi",
    albumArt: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=400&q=80",
    duration: 124,
    source: "spotify",
    url: "https://open.spotify.com/track/4wf7e8kF1kSj493D1Qk36u",
    category: "lofi",
  },
  {
    id: "song-5",
    title: "Legends Never Die",
    artist: "Against The Current (League of Legends)",
    albumArt: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    duration: 235,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=r6zIGXunKC8",
    category: "gaming",
  },
  {
    id: "song-6",
    title: "Megalovania",
    artist: "Toby Fox",
    albumArt: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
    duration: 156,
    source: "soundcloud",
    url: "https://soundcloud.com/toby-fox/megalovania",
    category: "gaming",
  },
  {
    id: "song-7",
    title: "Blinding Lights",
    artist: "The Weeknd",
    albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
    duration: 200,
    source: "spotify",
    url: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
    category: "hits",
  },
  {
    id: "song-8",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    duration: 230,
    source: "spotify",
    url: "https://open.spotify.com/track/7MXVkk9YM5IZxh0WSlVIh0",
    category: "hits",
  },
  {
    id: "song-9",
    title: "Feel Good Inc.",
    artist: "Gorillaz",
    albumArt: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80",
    duration: 221,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=HyHNuVaZJ-k",
    category: "rock",
  },
  {
    id: "song-10",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    albumArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80",
    duration: 354,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    category: "rock",
  },
  {
    id: "song-11",
    title: "Sunset Lover",
    artist: "Petit Biscuit",
    albumArt: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
    duration: 237,
    source: "soundcloud",
    url: "https://soundcloud.com/petitbiscuit/sunset-lover",
    category: "lofi",
  },
  {
    id: "song-12",
    title: "Cyberpunk 2077 - Rebel Path",
    artist: "P.T. Adamczyk",
    albumArt: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80",
    duration: 219,
    source: "youtube",
    url: "https://www.youtube.com/watch?v=4U7oKrk0_5o",
    category: "synthwave",
  },
];

export const MOCK_SOUNDS: SoundItem[] = [
  { id: "snd-1", name: "Airhorn MLG", emoji: "📢", category: "memes", duration: 2, preset: "airhorn", playsCount: 142 },
  { id: "snd-2", name: "Sad Violin", emoji: "🎻", category: "memes", duration: 4, preset: "violin", playsCount: 98 },
  { id: "snd-3", name: "Ta-Da Fanfare", emoji: "🎺", category: "sfx", duration: 2, preset: "tada", playsCount: 65 },
  { id: "snd-4", name: "Ba-Dum Tss", emoji: "🥁", category: "memes", duration: 2, preset: "badumtss", playsCount: 84 },
  { id: "snd-5", name: "Bruh Sound", emoji: "🤖", category: "memes", duration: 1, preset: "bruh", playsCount: 210 },
  { id: "snd-6", name: "Quack Pato", emoji: "🦆", category: "memes", duration: 1, preset: "quack", playsCount: 77 },
  { id: "snd-7", name: "Alarma Nuclear", emoji: "🚨", category: "sfx", duration: 3, preset: "alarm", playsCount: 52 },
  { id: "snd-8", name: "Level Up Retro", emoji: "⭐", category: "gaming", duration: 2, preset: "levelup", playsCount: 130 },
  { id: "snd-9", name: "Victory Royale", emoji: "🏆", category: "gaming", duration: 4, preset: "victory", playsCount: 164 },
  { id: "snd-10", name: "Aplausos Masivos", emoji: "👏", category: "reactions", duration: 3, preset: "applause", playsCount: 43 },
  { id: "snd-11", name: "Anime Wow", emoji: "✨", category: "anime", duration: 2, preset: "tada", playsCount: 119 },
  { id: "snd-12", name: "Game Over", emoji: "💀", category: "gaming", duration: 3, preset: "violin", playsCount: 88 },
];

export const MOCK_PHRASE_TRIGGERS: PhraseTrigger[] = [
  {
    id: "trg-1",
    phrase: "GG",
    soundId: "snd-1",
    soundName: "Airhorn MLG",
    soundEmoji: "📢",
    exactMatch: false,
    enabled: true,
    channelTarget: "all",
    triggerCount: 38,
    lastTriggered: "Hace 12 min",
  },
  {
    id: "trg-2",
    phrase: "Victoria",
    soundId: "snd-9",
    soundName: "Victory Royale",
    soundEmoji: "🏆",
    exactMatch: false,
    enabled: true,
    channelTarget: "vc-1",
    triggerCount: 15,
    lastTriggered: "Hace 1 hora",
  },
  {
    id: "trg-3",
    phrase: "F",
    soundId: "snd-2",
    soundName: "Sad Violin",
    soundEmoji: "🎻",
    exactMatch: true,
    enabled: true,
    channelTarget: "all",
    triggerCount: 52,
    lastTriggered: "Hace 23 min",
  },
  {
    id: "trg-4",
    phrase: "Bruh",
    soundId: "snd-5",
    soundName: "Bruh Sound",
    soundEmoji: "🤖",
    exactMatch: false,
    enabled: true,
    channelTarget: "all",
    triggerCount: 89,
    lastTriggered: "Hace 4 min",
  },
  {
    id: "trg-5",
    phrase: "Alerta",
    soundId: "snd-7",
    soundName: "Alarma Nuclear",
    soundEmoji: "🚨",
    exactMatch: false,
    enabled: false,
    channelTarget: "vc-1",
    triggerCount: 6,
    lastTriggered: "Ayer",
  },
];

export const MOCK_INITIAL_EVENTS: LiveEvent[] = [
  {
    id: "evt-1",
    type: "voice_trigger",
    title: "Phrase Trigger Activado",
    description: "Usuario 'AlexGamer' dijo 'GG' en 🔊 General → Sonido 📢 Airhorn",
    timestamp: "Hace 2 min",
  },
  {
    id: "evt-2",
    type: "music_play",
    title: "Nueva Canción en Cola",
    description: "Añadida 'Resonance - HOME' por @AlexGamer",
    timestamp: "Hace 8 min",
  },
  {
    id: "evt-3",
    type: "tts",
    title: "TTS Transmitido",
    description: "'¡Partida iniciada, buena suerte a todos!' en 🔊 General",
    timestamp: "Hace 15 min",
  },
  {
    id: "evt-4",
    type: "soundboard",
    title: "Soundboard Reproducido",
    description: "Efecto 'Ta-Da Fanfare' 🎺 disparado desde la web",
    timestamp: "Hace 22 min",
  },
];
