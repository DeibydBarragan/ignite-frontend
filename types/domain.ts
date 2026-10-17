// Fuente única de verdad — tipos de negocio.
// lib/mock-data.ts solo contiene fixtures y re-exporta desde aquí (Fase 1.2).

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

export type Guild = DiscordGuild;
export type User = DiscordUser;

export type MusicSource = "youtube" | "spotify";

export type SongCategory = "lofi" | "gaming" | "synthwave" | "hits" | "rock";

export interface SongRequester {
  id: string;
  username: string;
  avatar: string | null;
}

export interface Song {
  id: string;
  /** Identidad estable del elemento en la cola (asignada por el bot). */
  trackId?: string;
  title: string;
  artist: string;
  albumArt: string;
  coverUrl?: string | null;
  duration: number;
  formattedDuration?: string;
  source: MusicSource;
  url: string;
  category: SongCategory;
  isLyric?: boolean;
  isAutoplay?: boolean;
  isLive?: boolean;
  playCount?: number;
  rank?: number;
  requestedBy?: SongRequester | null;
}

export type SoundCategory = "memes" | "gaming" | "reactions" | "sfx" | "anime";

export type SoundPreset =
  | "airhorn"
  | "violin"
  | "tada"
  | "badumtss"
  | "bruh"
  | "quack"
  | "alarm"
  | "levelup"
  | "victory"
  | "applause";

export interface SoundItem {
  id: string;
  name: string;
  emoji?: string;
  category: SoundCategory;
  duration: number;
  preset: SoundPreset;
  playsCount: number;
  hasFile?: boolean;
  uploadedBy?: string | null;
  lastPlayedAt?: number | null;
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

export type LiveEventType = "voice_trigger" | "tts" | "music_play" | "soundboard";

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  title: string;
  description: string;
  timestamp: string;
}

export type RepeatMode = "off" | "track" | "queue";

export interface ApiPlayerState {
  hasQueue: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  autoplay: boolean;
  filter: string | null;
  voiceChannel: { id: string; name: string } | null;
  currentSong: Song | null;
  queue: Song[];
  disconnectReason?: string | null;
}

export interface ApiGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

export interface ApiVoiceMember {
  id: string;
  username: string;
  avatar: string | null;
  bot: boolean;
}

export interface ApiVoiceChannel {
  id: string;
  name: string;
  bitrate: number;
  userLimit: number;
  userCount: number;
  botPresent: boolean;
  members: ApiVoiceMember[];
}

export interface ApiVoiceStatus {
  bot: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
  canControl: boolean;
}

export interface VoiceItem {
  id: string;
  name: string;
  gender: string;
  lang: string;
  flag: string;
  provider: string;
  description?: string;
}

export interface SoundboardTrack {
  id: string;
  name: string;
  emoji?: string;
  category: string;
  duration: number;
  preset?: string;
  playsCount: number;
  file?: string | null;
  hasFile?: boolean;
  uploadedBy?: string | null;
  lastPlayedAt?: number | null;
}

export interface SoundPlayResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
  channel?: { id: string; name: string };
}

export interface UserPlaylist {
  id: string;
  user_id?: string;
  name: string;
  source: MusicSource;
  url: string;
  cover: string;
  /** Snapshot de lectura (puede estar desactualizado). La verdad vive en `url`. */
  tracks: Song[];
  /** Cuándo se sincronizó el snapshot con la plataforma. null = nunca. */
  synced_at?: string | null;
  created_at?: string;
}

export interface SavedPhrase {
  id: string;
  user_id?: string;
  title: string;
  text: string;
  voice: string;
  pitch: number;
  rate: number;
  created_at?: string;
}
