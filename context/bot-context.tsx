"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  DiscordUser,
  DiscordGuild,
  VoiceChannel,
  Song,
  MusicSource,
  SoundItem,
  PhraseTrigger,
  TTSMessage,
  LiveEvent,
  MOCK_SOUNDS,
  MOCK_PHRASE_TRIGGERS,
  MOCK_INITIAL_EVENTS,
} from "@/lib/mock-data";
import { audioSynth } from "@/lib/audio-synth";
import { igniteApi } from "@/lib/ignite-api";
import { soundApi, type SoundboardTrack } from "@/lib/sound-api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { AUDIO_FILTER_LABELS } from "@/lib/audio-filters";

const SOUND_PRESETS: SoundItem["preset"][] = [
  "airhorn", "violin", "tada", "badumtss", "bruh",
  "quack", "alarm", "levelup", "victory", "applause",
];

const SCOPES_STORAGE_KEY = "ignite_sound_scopes";

export function getStoredSoundScopes(): Record<string, "mine" | "all"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SCOPES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredSoundScope(soundId: string, scope: "mine" | "all" | null) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSoundScopes();
    if (scope === null) {
      delete current[soundId];
    } else {
      current[soundId] = scope;
    }
    localStorage.setItem(SCOPES_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

const RECENT_PLAYED_KEY = "ignite_sound_recent_played";

export function getStoredRecentPlayed(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RECENT_PLAYED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredRecentPlayed(soundId: string, timestamp = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredRecentPlayed();
    if (timestamp <= 0) {
      delete current[soundId];
    } else {
      current[soundId] = timestamp;
    }
    localStorage.setItem(RECENT_PLAYED_KEY, JSON.stringify(current));
  } catch {}
}

/** Sonido remoto del bot -> SoundItem local (para la sección "Todos"). */
function mapRemoteSound(r: SoundboardTrack): SoundItem {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    category: (["memes", "gaming", "reactions", "sfx", "anime"] as const).includes(
      r.category as SoundItem["category"]
    )
      ? (r.category as SoundItem["category"])
      : "memes",
    duration: r.duration || 2,
    preset: (SOUND_PRESETS as string[]).includes(r.preset || "")
      ? (r.preset as SoundItem["preset"])
      : "tada",
    playsCount: r.playsCount ?? 0,
    hasFile: r.hasFile ?? false,
    uploadedBy: r.uploadedBy ?? null,
    lastPlayedAt: r.lastPlayedAt ?? null,
  };
}

interface BotContextType {
  // Auth & Guild
  user: DiscordUser | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  loginDiscord: () => Promise<void>;
  logoutDiscord: () => Promise<void>;
  guilds: DiscordGuild[];
  selectedGuildId: string;
  selectedGuild: DiscordGuild | null;
  setSelectedGuildId: (id: string) => void;
  isVoiceConnected: boolean;
  currentVoiceChannel: VoiceChannel | null;
  setVoiceConnection: (connected: boolean, channelId?: string) => void;
  isBotOnline: boolean;

  // Music Player & Queue
  catalog: Song[];
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: "off" | "track" | "queue";
  shuffle: boolean;
  playSong: (song: Song) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  moveQueueSong: (fromIndex: number, toIndex: number) => Promise<void>;
  jumpToQueueSong: (index: number) => Promise<void>;
  clearQueue: () => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  stopPlayback: () => void;
  autoplay: boolean;
  toggleAutoplay: () => void;
  currentFilter: string | null;
  setFilter: (name: string) => void;
  defaultProvider: MusicSource;
  setDefaultProvider: (provider: MusicSource) => void;
  importUrlSong: (url: string, opts?: { skip?: boolean; next?: boolean }) => Promise<{ success: boolean; message: string; song?: Song }>;

  // Favorites (Supabase & Discord sync)
  favorites: Song[];
  isLoadingFavorites: boolean;
  isFavorite: (songIdOrUrl: string) => boolean;
  toggleFavorite: (song: Song) => Promise<void>;
  importPlaylistToFavorites: (input: {
    name: string;
    url: string;
  }) => Promise<{ added: number; skipped: number; total: number; error: string | null }>;
  playFavorites: () => Promise<void>;

  // Loading & Action Locking States
  isPlayerBusy: boolean;
  pendingAction: "skip" | "previous" | "toggle" | "play" | "playNext" | "queue" | "clear" | "reorder" | "stop" | null;
  loadingSongId: string | null;
  removingSongId: string | null;
  isSkipping: boolean;
  isTogglingPlay: boolean;
  isAddingToQueue: boolean;
  isReordering: boolean;
  syncPlayerState: () => Promise<void>;

  // TTS
  recentTTS: TTSMessage[];
  sendTTS: (text: string, voice: string, pitch: number, rate: number) => void;

  // Soundboard & Phrases
  sounds: SoundItem[];
  phraseTriggers: PhraseTrigger[];
  liveEvents: LiveEvent[];
  activeSoundId: string | null;
  playSound: (soundId: string) => void;
  addCustomSound: (sound: {
    name: string;
    emoji?: string;
    category: SoundItem["category"];
    file?: File;
    scope?: "mine" | "all";
  }) => Promise<boolean>;
  editCustomSound: (
    soundId: string,
    data: {
      name: string;
      emoji?: string;
      category: SoundItem["category"];
      scope?: "mine" | "all";
      uploadedBy?: string | null;
    }
  ) => Promise<boolean>;
  deleteCustomSound: (soundId: string) => Promise<boolean>;
  attachSoundAudio: (soundId: string, file: File) => Promise<boolean>;
  addPhraseTrigger: (trigger: { phrase: string; soundId: string; exactMatch: boolean; channelTarget: string }) => void;
  togglePhraseTrigger: (id: string) => void;
  deletePhraseTrigger: (id: string) => void;
  simulatePhraseDetection: (triggerId: string) => void;
  clearLiveEvents: () => void;
}

const BotContext = createContext<BotContextType | null>(null);

export function BotProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const offlineFailsRef = useRef(0);
  const lastNotifiedDisconnectRef = useRef<string | null>(null);
  const knownSongIdsRef = useRef<Set<string>>(new Set());
  const botVoiceChannelRef = useRef<{ id: string; name: string } | null>(null);

  // User & Guild State
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID || ""
  );
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(false);
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<string>("");
  const [isBotOnline, setIsBotOnline] = useState<boolean>(true);

  // Servidores y canales de voz REALES desde el bot (sin mocks).
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const apiGuilds = await igniteApi.getGuilds();
        if (cancelled || apiGuilds.length === 0) return;

        const withChannels = await Promise.all(
          apiGuilds.map(async (g) => {
            const channels = await igniteApi.getVoiceChannels(g.id);
            const voiceChannels: VoiceChannel[] = channels.map((c) => ({
              id: c.id,
              name: c.name,
              userCount: c.userCount,
              bitrate: c.bitrate,
            }));
            return {
              id: g.id,
              name: g.name,
              icon: g.icon || "https://cdn.discordapp.com/embed/avatars/0.png",
              memberCount: g.memberCount,
              botPresent: true,
              voiceChannels,
            } as DiscordGuild;
          })
        );

        if (cancelled || withChannels.length === 0) return;
        setGuilds(withChannels);
        setSelectedGuildId((prev) =>
          withChannels.some((g) => g.id === prev) ? prev : withChannels[0].id
        );
      } catch {
        // Fallback: se mantienen los mocks iniciales
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Presencia de voz REAL del usuario vía el bot (poll cada 3s).
  useEffect(() => {
    if (!isLoggedIn || !user || !selectedGuildId) return;
    let cancelled = false;
    const check = async () => {
      const status = await igniteApi.getVoiceStatus(selectedGuildId, user.id);
      if (cancelled || !status) return;
      if (status.user) {
        setIsVoiceConnected(true);
        setCurrentVoiceChannelId(status.user.id);
      } else {
        setIsVoiceConnected(false);
        setCurrentVoiceChannelId("");
      }
      if (status.bot) {
        botVoiceChannelRef.current = status.bot;
      } else {
        botVoiceChannelRef.current = null;
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, user, selectedGuildId]);

  // Music State
  const [catalog] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "track" | "queue">("off");
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<MusicSource>("youtube");

  // TTS State
  const [recentTTS, setRecentTTS] = useState<TTSMessage[]>([
    {
      id: "tts-1",
      text: "¡Partida iniciada, buena suerte a todos!",
      voice: "Jorge (Español)",
      pitch: 1.0,
      rate: 1.0,
      channelName: "General (Voz)",
      timestamp: "Hace 15 min",
    },
    {
      id: "tts-2",
      text: "El bot de música está listo para recibir comandos.",
      voice: "Lucía (Español)",
      pitch: 1.1,
      rate: 1.0,
      channelName: "General (Voz)",
      timestamp: "Hace 32 min",
    },
  ]);

  // Soundboard & Phrases State
  const [sounds, setSounds] = useState<SoundItem[]>(MOCK_SOUNDS);
  const [phraseTriggers, setPhraseTriggers] = useState<PhraseTrigger[]>(MOCK_PHRASE_TRIGGERS);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(MOCK_INITIAL_EVENTS);
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);

  // Sincroniza con el catálogo real del bot: actualiza los conocidos y
  // añade los que falten (propios y comunitarios). Se ejecuta para todos los usuarios.
  useEffect(() => {
    let cancelled = false;
    soundApi
      .getSounds()
      .then((remote) => {
        if (cancelled || !remote) return;
        const storedScopes = getStoredSoundScopes();
        const storedRecent = getStoredRecentPlayed();
        setSounds((prev) => {
          const merged = prev.map((s) => {
            const r = remote.find((x) => x.id === s.id);
            const overrideScope = storedScopes[s.id];
            let effectiveUploadedBy = r ? (r.uploadedBy !== undefined ? r.uploadedBy : s.uploadedBy) : s.uploadedBy;
            if (overrideScope === "mine") {
              effectiveUploadedBy = effectiveUploadedBy || "750899475404292126";
            } else if (overrideScope === "all") {
              effectiveUploadedBy = null;
            }
            const lastPlayedAt = storedRecent[s.id] ?? r?.lastPlayedAt ?? s.lastPlayedAt ?? null;
            return r
              ? {
                  ...s,
                  playsCount: Math.max(s.playsCount, r.playsCount ?? 0),
                  hasFile: r.hasFile ?? s.hasFile,
                  uploadedBy: effectiveUploadedBy ?? null,
                  lastPlayedAt,
                }
              : { ...s, uploadedBy: effectiveUploadedBy ?? null, lastPlayedAt };
          });
          const known = new Set(merged.map((s) => s.id));
          const missing = remote
            .filter((r) => !known.has(r.id))
            .map((r) => {
              const mapped = mapRemoteSound(r);
              const overrideScope = storedScopes[mapped.id];
              if (overrideScope === "mine") {
                mapped.uploadedBy = mapped.uploadedBy || "750899475404292126";
              } else if (overrideScope === "all") {
                mapped.uploadedBy = null;
              }
              mapped.lastPlayedAt = storedRecent[mapped.id] ?? r.lastPlayedAt ?? null;
              return mapped;
            });
          return [...merged, ...missing];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) || guilds[0] || null;
  const currentVoiceChannel = isVoiceConnected
    ? selectedGuild?.voiceChannels.find((vc) => vc.id === currentVoiceChannelId) || selectedGuild?.voiceChannels[0] || null
    : null;

  // Music Scrubber Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentSong.duration) {
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  // Loading & Action locking state
  const [isPlayerBusy, setIsPlayerBusy] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"skip" | "previous" | "toggle" | "play" | "playNext" | "queue" | "clear" | "reorder" | "stop" | null>(null);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);

  const isSkipping = pendingAction === "skip";
  const isTogglingPlay = pendingAction === "toggle";
  const isAddingToQueue = pendingAction === "queue";
  const isReordering = pendingAction === "reorder";

  // Favorites State (Supabase sync)
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);

  // Real-time synchronization with Bot REST API
  const syncPlayerState = useCallback(async () => {
    if (!isLoggedIn || !selectedGuildId) return;
    try {
      const state = await igniteApi.getPlayerState(selectedGuildId);
      if (!state) {
        offlineFailsRef.current += 1;
        setIsBotOnline(false);
        if (offlineFailsRef.current >= 2) {
          setIsPlaying(false);
        }
        return;
      }
      offlineFailsRef.current = 0;
      setIsBotOnline(true);

      if (state.hasQueue && state.currentSong) {
        setCurrentSong(state.currentSong);
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.currentTime);
        setVolume(state.volume);
        setRepeatMode(state.repeatMode);
        setAutoplay(state.autoplay);
        setCurrentFilter(state.filter ?? null);
        setQueue(state.queue);
        setIsVoiceConnected(true);
        if (state.voiceChannel) {
          botVoiceChannelRef.current = state.voiceChannel;
          setCurrentVoiceChannelId(state.voiceChannel.id);
        }

        // Detectar canciones añadidas automáticamente por Autoplay
        const allSongs = [state.currentSong, ...(state.queue || [])];
        for (const s of allSongs) {
          if (s.isAutoplay && !knownSongIdsRef.current.has(s.id)) {
            knownSongIdsRef.current.add(s.id);
            toast(`Autoplay: canción recomendada añadida a la cola ("${s.title}")`, "info", {
              duration: 4000,
            });
            setLiveEvents((prev) => [
              {
                id: "evt-" + Date.now(),
                type: "music_play",
                title: "Autoplay",
                description: `Canción recomendada añadida: '${s.title}'`,
                timestamp: "Ahora mismo",
              },
              ...prev.slice(0, 19),
            ]);
          } else {
            knownSongIdsRef.current.add(s.id);
          }
        }
      } else if (!state.hasQueue) {
        setCurrentSong(null);
        setIsPlaying(false);
        setQueue([]);
        setCurrentTime(0);
        setAutoplay(state.autoplay);
        setCurrentFilter(null);
        botVoiceChannelRef.current = null;
      }

      // Notificar desconexión por inactividad si el bot la reporta
      if (state.disconnectReason && lastNotifiedDisconnectRef.current !== state.disconnectReason) {
        lastNotifiedDisconnectRef.current = state.disconnectReason;
        const msg =
          state.disconnectReason === "inactivity_empty"
            ? "El bot se desconectó del canal de voz porque no quedaba nadie en la sala."
            : "El bot se desconectó por inactividad tras finalizar la música.";
        toast(msg, "info", { duration: 6000 });
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "voice_trigger",
            title: "Desconexión por inactividad",
            description: msg,
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
      } else if (!state.disconnectReason) {
        lastNotifiedDisconnectRef.current = null;
      }
    } catch {
      offlineFailsRef.current += 1;
      setIsBotOnline(false);
      if (offlineFailsRef.current >= 2) {
        setIsPlaying(false);
      }
    }
  }, [isLoggedIn, selectedGuildId, toast]);

  const checkVoiceRequirement = useCallback(async (): Promise<{ canPlay: boolean; reason?: string }> => {
    if (!isLoggedIn || !user || !selectedGuildId) return { canPlay: true };

    if (!isBotOnline) {
      toast("El bot de música está desconectado. Inicia el bot para reproducir música.", "error");
      return { canPlay: false, reason: "El bot de música está desconectado. Inicia el bot para reproducir música." };
    }

    try {
      const status = await igniteApi.getVoiceStatus(selectedGuildId, user.id);
      if (!status) {
        setIsBotOnline(false);
        toast("El bot de música está desconectado. Inicia el bot para reproducir música.", "error");
        return { canPlay: false, reason: "El bot de música está desconectado. Inicia el bot para reproducir música." };
      }

      setIsBotOnline(true);
      if (status.user) {
        setIsVoiceConnected(true);
        setCurrentVoiceChannelId(status.user.id);
      } else {
        setIsVoiceConnected(false);
        setCurrentVoiceChannelId("");
      }
      if (status.bot) {
        botVoiceChannelRef.current = status.bot;
      } else {
        botVoiceChannelRef.current = null;
      }

      // 1. Debe estar en un canal de voz
      if (!status.user) {
        toast("¡Debes estar en un canal de voz en Discord para reproducir música!", "error", {
          duration: 5000,
        });
        return { canPlay: false, reason: "¡Debes estar en un canal de voz en Discord para reproducir música!" };
      }

      // 2. Si el bot ya está en un canal, el usuario debe estar en el mismo canal
      if (status.bot && status.user.id !== status.bot.id) {
        toast(
          `¡Debes estar en el mismo canal de voz que el bot ("${status.bot.name}")! Estás en "${status.user.name}".`,
          "error",
          { duration: 5500 }
        );
        return {
          canPlay: false,
          reason: `¡Debes estar en el mismo canal de voz que el bot ("${status.bot.name}")!`,
        };
      }

      return { canPlay: true };
    } catch {
      setIsBotOnline(false);
      toast("El bot de música está desconectado. Inicia el bot para reproducir música.", "error");
      return { canPlay: false, reason: "El bot de música está desconectado. Inicia el bot para reproducir música." };
    }
  }, [isLoggedIn, user, selectedGuildId, isBotOnline, toast]);

  // Chequeo de salud del bot al iniciar
  useEffect(() => {
    let cancelled = false;
    igniteApi
      .getHealth()
      .then((health) => {
        if (!cancelled) setIsBotOnline(Boolean(health));
      })
      .catch(() => {
        if (!cancelled) setIsBotOnline(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;
    const runSync = async () => {
      if (!isMounted) return;
      await syncPlayerState();
    };

    const interval = setInterval(runSync, 2000);
    runSync();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, syncPlayerState]);

  // Fetch favorites from Supabase for a given user ID
  const fetchFavorites = useCallback(async (uid: string) => {
    setIsLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: Song[] = data.map((item: any) => ({
          id: item.song_id || item.url,
          title: item.title,
          artist: item.artist,
          albumArt:
            item.album_art ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
          duration: item.duration || 180,
          source: (item.source as Song["source"]) || "youtube",
          url: item.url,
          category: "hits",
          isLyric: item.is_lyric ?? false,
        }));
        setFavorites(mapped);
      }
    } catch (err) {
      console.error("Error loading favorites from Supabase:", err);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  // Sync Supabase Auth session with Discord user profile
  useEffect(() => {
    const resolveDiscordId = (sessionUser: any): string => {
      const meta = sessionUser?.user_metadata || {};
      const identities = sessionUser?.identities || [];
      const discordIdentity = identities.find((i: any) => i.provider === "discord") || identities[0];
      return (
        discordIdentity?.id ||
        discordIdentity?.identity_data?.provider_id ||
        discordIdentity?.identity_data?.sub ||
        meta.custom_claims?.sub ||
        meta.provider_id ||
        meta.sub ||
        sessionUser?.id ||
        "750899475404292126"
      );
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const discordId = resolveDiscordId(session.user);
        const username =
          meta.custom_claims?.global_name ||
          meta.full_name ||
          meta.user_name ||
          meta.name ||
          "Usuario";
        const avatar = meta.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";

        setUser({
          id: discordId,
          username,
          discriminator: "0",
          avatar,
          status: "online",
          isVoiceConnected: false,
          currentChannelId: null,
        });
        setIsLoggedIn(true);
        fetchFavorites(discordId);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setFavorites([]);
      }
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const discordId = resolveDiscordId(session.user);
        const username =
          meta.custom_claims?.global_name ||
          meta.full_name ||
          meta.user_name ||
          meta.name ||
          "Usuario";
        const avatar = meta.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";

        setUser({
          id: discordId,
          username,
          discriminator: "0",
          avatar,
          status: "online",
          isVoiceConnected: false,
          currentChannelId: null,
        });
        setIsLoggedIn(true);
        fetchFavorites(discordId);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setFavorites([]);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchFavorites]);

  const loginDiscord = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
    } catch (err) {
      console.error("Discord login error:", err);
    }
  }, []);

  const logoutDiscord = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(false);
      setFavorites([]);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  const isFavorite = useCallback(
    (songIdOrUrl: string) => {
      return favorites.some(
        (f) => f.id === songIdOrUrl || f.url === songIdOrUrl
      );
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (song: Song) => {
      if (!isLoggedIn || !user) return;
      const uid = user.id;
      const isAlready = favorites.some(
        (f) => f.id === song.id || f.url === song.url
      );

      if (isAlready) {
        // Optimistic UI update
        setFavorites((prev) =>
          prev.filter((f) => f.id !== song.id && f.url !== song.url)
        );
        try {
          const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", uid)
            .or(`song_id.eq.${song.id},url.eq.${song.url}`);
          if (error) throw error;
        } catch (err) {
          console.error("Error removing favorite from Supabase:", err);
          // Revertir: el borrado no se aplicó.
          setFavorites((prev) => [song, ...prev]);
        }
      } else {
        // Optimistic UI update
        setFavorites((prev) => [song, ...prev]);
        const row = {
          user_id: uid,
          song_id: song.id,
          title: song.title,
          artist: song.artist,
          album_art: song.albumArt,
          url: song.url,
          duration: song.duration,
          source: song.source,
          is_lyric: song.isLyric ?? false,
        };
        try {
          const { error } = await supabase.from("user_favorites").insert(row);
          if (error) throw error;
        } catch (err) {
          // Si la columna is_lyric aún no existe en Supabase, reintentar sin ella.
          try {
            const { is_lyric, ...legacyRow } = row;
            const { error } = await supabase.from("user_favorites").insert(legacyRow);
            if (error) throw error;
          } catch (retryErr) {
            console.error("Error adding favorite to Supabase:", retryErr);
            // Revertir: el guardado no se aplicó.
            setFavorites((prev) => prev.filter((f) => f.id !== song.id && f.url !== song.url));
          }
        }
      }
    },
    [isLoggedIn, user, favorites]
  );

  const setVoiceConnection = (connected: boolean, channelId?: string) => {
    if (!isLoggedIn) return;
    setIsVoiceConnected(connected);
    if (connected && channelId) {
      setCurrentVoiceChannelId(channelId);
    } else if (connected && !channelId && (selectedGuild?.voiceChannels.length || 0) > 0) {
      setCurrentVoiceChannelId(selectedGuild!.voiceChannels[0].id);
    }
    setUser((prev) => (prev ? ({
      ...prev,
      isVoiceConnected: connected,
      currentChannelId: connected ? channelId || selectedGuild?.voiceChannels[0]?.id || null : null,
    }) : null));
  };

  const playSong = useCallback(async (song: Song) => {
    if (!isLoggedIn || isPlayerBusy) return;

    const voiceCheck = await checkVoiceRequirement();
    if (!voiceCheck.canPlay) return;

    setIsPlayerBusy(true);
    setPendingAction("play");
    setLoadingSongId(song.id);

    const prevSong = currentSong;
    const prevPlaying = isPlaying;
    const prevTime = currentTime;

    const songWithRequester: Song = {
      ...song,
      requestedBy: user
        ? { id: user.id, username: user.username, avatar: user.avatar || null }
        : song.requestedBy || null,
    };
    setCurrentSong(songWithRequester);
    setCurrentTime(0);
    setIsPlaying(true);

    try {
      const res = await igniteApi.play(selectedGuildId, {
        query: song.url || `${song.title} ${song.artist}`,
        voiceChannelId: currentVoiceChannelId || undefined,
        userId: user?.id || undefined,
        skip: true,
      });

      if (!res.success) {
        setCurrentSong(prevSong);
        setIsPlaying(prevPlaying);
        setCurrentTime(prevTime);
        if (!res.error?.includes("canal de voz")) {
          setIsBotOnline(false);
        }
        toast(res.error || "No se pudo reproducir la canción. El bot no está disponible.", "error");
        return;
      }

      setIsBotOnline(true);
      setLiveEvents((prev) => [
        {
          id: "evt-" + Date.now(),
          type: "music_play",
          title: "Reproduciendo",
          description: `'${song.title} - ${song.artist}' enviada al bot`,
          timestamp: "Ahora mismo",
        },
        ...prev.slice(0, 19),
      ]);
      await syncPlayerState();
    } catch {
      setCurrentSong(prevSong);
      setIsPlaying(prevPlaying);
      setCurrentTime(prevTime);
      setIsBotOnline(false);
      toast("Error al conectar con el servicio del bot.", "error");
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
      setLoadingSongId(null);
    }
  }, [isLoggedIn, isPlayerBusy, checkVoiceRequirement, currentSong, isPlaying, currentTime, selectedGuildId, currentVoiceChannelId, user, syncPlayerState, toast]);

  const addToQueue = useCallback(async (song: Song) => {
    if (!isLoggedIn || loadingSongId === song.id) return;

    const voiceCheck = await checkVoiceRequirement();
    if (!voiceCheck.canPlay) return;

    setPendingAction("queue");
    setLoadingSongId(song.id);
    const songWithRequester: Song = {
      ...song,
      requestedBy: user
        ? { id: user.id, username: user.username, avatar: user.avatar || null }
        : song.requestedBy || null,
    };
    try {
      const res = await igniteApi.play(selectedGuildId, {
        query: song.url || `${song.title} ${song.artist}`,
        voiceChannelId: currentVoiceChannelId || undefined,
        userId: user?.id || undefined,
        skip: false,
      });

      if (!res.success) {
        if (!res.error?.includes("canal de voz")) {
          setIsBotOnline(false);
        }
        toast(res.error || "No se pudo añadir a la cola. El bot no está disponible.", "error");
        return;
      }

      setIsBotOnline(true);
      setQueue((prev) => [...prev, songWithRequester]);
      setLiveEvents((prev) => [
        {
          id: "evt-" + Date.now(),
          type: "music_play",
          title: "Añadido a la cola",
          description: `'${song.title}' añadida a la lista de espera`,
          timestamp: "Ahora mismo",
        },
        ...prev.slice(0, 19),
      ]);
      await syncPlayerState();
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el servicio del bot.", "error");
    } finally {
      setPendingAction(null);
      setLoadingSongId(null);
    }
  }, [isLoggedIn, loadingSongId, checkVoiceRequirement, selectedGuildId, currentVoiceChannelId, user, syncPlayerState, toast]);

  const playNext = useCallback(async (song: Song) => {
    if (!isLoggedIn || loadingSongId === song.id) return;

    const voiceCheck = await checkVoiceRequirement();
    if (!voiceCheck.canPlay) return;

    setPendingAction("playNext");
    setLoadingSongId(song.id);
    const songWithRequester: Song = {
      ...song,
      requestedBy: user
        ? { id: user.id, username: user.username, avatar: user.avatar || null }
        : song.requestedBy || null,
    };
    try {
      const res = await igniteApi.play(selectedGuildId, {
        query: song.url || `${song.title} ${song.artist}`,
        voiceChannelId: currentVoiceChannelId || undefined,
        userId: user?.id || undefined,
        next: true,
        skip: false,
      });

      if (!res.success) {
        if (!res.error?.includes("canal de voz")) {
          setIsBotOnline(false);
        }
        toast(res.error || "No se pudo añadir la canción. El bot no está disponible.", "error");
        return;
      }

      setIsBotOnline(true);
      setQueue((prev) => [songWithRequester, ...prev]);
      setLiveEvents((prev) => [
        {
          id: "evt-" + Date.now(),
          type: "music_play",
          title: "Siguiente en cola",
          description: `'${song.title}' se reproducirá a continuación`,
          timestamp: "Ahora mismo",
        },
        ...prev.slice(0, 19),
      ]);
      await syncPlayerState();
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el servicio del bot.", "error");
    } finally {
      setPendingAction(null);
      setLoadingSongId(null);
    }
  }, [isLoggedIn, loadingSongId, checkVoiceRequirement, selectedGuildId, currentVoiceChannelId, user, syncPlayerState, toast]);

  const playFavorites = useCallback(async () => {
    if (!isLoggedIn || !favorites.length || isPlayerBusy) return;
    const [first, ...rest] = favorites;
    await playSong(first);
    for (const song of rest) {
      await addToQueue(song);
    }
  }, [isLoggedIn, favorites, isPlayerBusy, playSong, addToQueue]);

  // Importar una playlist a favoritos: resuelve sus temas y los guarda de una vez.
  const importPlaylistToFavorites = useCallback(async (input: { name: string; url: string }) => {
    if (!isLoggedIn || !user) {
      return { added: 0, skipped: 0, total: 0, error: "Debes iniciar sesión con Discord." };
    }
    const uid = user.id;
    const res = await igniteApi.resolvePlaylist(selectedGuildId, input.url);
    const tracks = res.success && res.tracks ? res.tracks : [];
    if (tracks.length === 0) {
      return { added: 0, skipped: 0, total: 0, error: res.error || "No se pudieron obtener los temas de esa playlist." };
    }

    const fresh: Song[] = tracks
      .filter((t: any) => t?.url && !favorites.some((f) => f.id === t.id || f.url === t.url))
      .map((t: any) => ({
        id: t.id || t.url,
        title: t.title || "Sin título",
        artist: t.artist || "Desconocido",
        albumArt:
          t.albumArt ||
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: t.duration || 180,
        source: (t.source as Song["source"]) || "youtube",
        url: t.url,
        category: "hits" as const,
        isLyric: t.isLyric ?? false,
      }));

    if (fresh.length === 0) {
      return { added: 0, skipped: tracks.length, total: tracks.length, error: null };
    }

    setFavorites((prev) => [...fresh, ...prev]);

    const toRows = (withLyric: boolean) =>
      fresh.map((s) => ({
        user_id: uid,
        song_id: s.id,
        title: s.title,
        artist: s.artist,
        album_art: s.albumArt,
        url: s.url,
        duration: s.duration,
        source: s.source,
        ...(withLyric ? { is_lyric: s.isLyric ?? false } : {}),
      }));
    try {
      const { error } = await supabase.from("user_favorites").insert(toRows(true));
      if (error) throw error;
    } catch {
      // Si la columna is_lyric aún no existe, reintentar sin ella.
      try {
        const { error } = await supabase.from("user_favorites").insert(toRows(false));
        if (error) throw error;
      } catch (err) {
        console.error("Error importing playlist to favorites:", err);
        // Revertir el optimista para no mostrar fantasmas, y avisar de verdad.
        const freshIds = new Set(fresh.map((s) => s.id));
        setFavorites((prev) => prev.filter((s) => !freshIds.has(s.id)));
        return {
          added: 0,
          skipped: tracks.length - fresh.length,
          total: tracks.length,
          error: "No se pudo guardar en Supabase. Revisa tu conexión e inténtalo de nuevo.",
        };
      }
    }

    return { added: fresh.length, skipped: tracks.length - fresh.length, total: tracks.length, error: null };
  }, [isLoggedIn, user, favorites, selectedGuildId]);

  const removeFromQueue = useCallback(async (songId: string) => {
    if (!isLoggedIn || removingSongId === songId) return;
    setRemovingSongId(songId);
    try {
      const idx = queue.findIndex((s) => s.id === songId);
      setQueue((prev) => prev.filter((s) => s.id !== songId));
      if (idx !== -1) {
        await igniteApi.removeFromQueue(selectedGuildId, idx + 1);
        await syncPlayerState();
      }
    } catch (err) {
      console.error("Error removing from queue:", err);
    } finally {
      setRemovingSongId(null);
    }
  }, [isLoggedIn, queue, removingSongId, selectedGuildId, syncPlayerState]);

  // Índices 0-based sobre la cola visible (upcoming). El backend usa
  // posiciones 1-based sobre songs (0 = tema actual).
  const moveQueueSong = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!isLoggedIn || isPlayerBusy) return;
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return;

    setIsPlayerBusy(true);
    setPendingAction("reorder");

    const previousQueue = [...queue];

    setQueue((prev) => {
      const next = [...prev];
      const [song] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, song);
      return next;
    });

    // Feedback háptico táctil en dispositivos móviles
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(35);
    }

    try {
      const res = await igniteApi.moveInQueue(selectedGuildId, fromIndex + 1, toIndex + 1);
      if (res && res.success === false) {
        throw new Error(res.error || "No se pudo actualizar el orden en la cola.");
      }
      await syncPlayerState();
    } catch (err: any) {
      console.error("Error moving song in queue:", err);
      // Revertir el orden optimista si falló
      setQueue(previousQueue);
      toast(err?.message || "No se pudo cambiar el orden en la cola. Inténtalo de nuevo.", "error");
      await syncPlayerState();
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, queue, selectedGuildId, syncPlayerState, toast]);

  const jumpToQueueSong = useCallback(async (index: number) => {
    if (!isLoggedIn || isPlayerBusy) return;
    if (index < 0 || index >= queue.length) return;
    setIsPlayerBusy(true);
    try {
      await igniteApi.jumpInQueue(selectedGuildId, index + 1);
      await syncPlayerState();
    } catch (err) {
      console.error("Error jumping in queue:", err);
    } finally {
      setIsPlayerBusy(false);
    }
  }, [isLoggedIn, isPlayerBusy, queue.length, selectedGuildId, syncPlayerState]);

  const clearQueue = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy || queue.length === 0) return;
    setIsPlayerBusy(true);
    setPendingAction("clear");
    const backupQueue = [...queue];
    try {
      setQueue([]);
      await igniteApi.clearQueue(selectedGuildId);
      await syncPlayerState();

      toast(
        `Cola vaciada (${backupQueue.length} ${backupQueue.length === 1 ? "canción" : "canciones"}).`,
        "info",
        {
          duration: 7000,
          action: {
            label: "Deshacer",
            loadingLabel: "Restaurando...",
            loadingMessage: `Restaurando ${backupQueue.length} ${backupQueue.length === 1 ? "canción" : "canciones"} en la cola...`,
            successMessage: "Cola restaurada exitosamente.",
            onClick: async () => {
              setIsPlayerBusy(true);
              setPendingAction("reorder");
              setQueue(backupQueue);
              try {
                const undoRes = await igniteApi.undoClearQueue(selectedGuildId);
                if (!undoRes.success) {
                  for (const song of backupQueue) {
                    await igniteApi.play(selectedGuildId, {
                      query: song.url || `${song.title} ${song.artist}`,
                      userId: song.requestedBy?.id || user?.id || undefined,
                      skip: false,
                    });
                  }
                }
                await syncPlayerState();
              } finally {
                setIsPlayerBusy(false);
                setPendingAction(null);
              }
            },
          },
        }
      );
    } catch (err) {
      console.error("Error clearing queue:", err);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, queue, selectedGuildId, syncPlayerState, toast, user?.id]);

  const togglePlayPause = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("toggle");
    const prevPlaying = isPlaying;
    setIsPlaying(!prevPlaying);
    try {
      const res = await igniteApi.control(selectedGuildId, "toggle");
      if (!res.success) {
        setIsPlaying(prevPlaying);
        setIsBotOnline(false);
        toast(res.error || "El servicio del bot está desconectado o no responde.", "error");
        return;
      }
      setIsBotOnline(true);
      await syncPlayerState();
    } catch {
      setIsPlaying(prevPlaying);
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, isPlaying, selectedGuildId, syncPlayerState, toast]);

  const skipNext = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("skip");
    try {
      const res = await igniteApi.control(selectedGuildId, "skip");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo saltar la pista.", "error");
      } else {
        setIsBotOnline(true);
      }
      await syncPlayerState();
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, selectedGuildId, syncPlayerState, toast]);

  const skipPrevious = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("previous");
    try {
      const res = await igniteApi.control(selectedGuildId, "previous");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo volver a la pista anterior.", "error");
      } else {
        setIsBotOnline(true);
      }
      await syncPlayerState();
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, selectedGuildId, syncPlayerState, toast]);

  const seekTo = useCallback((seconds: number) => {
    if (!isLoggedIn || !currentSong) return;
    const clamped = Math.max(0, Math.min(seconds, currentSong.duration));
    setCurrentTime(clamped);
    igniteApi.control(selectedGuildId, "seek", clamped);
  }, [isLoggedIn, currentSong, selectedGuildId]);

  const setVolumeLevel = useCallback((vol: number) => {
    if (!isLoggedIn) return;
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
    igniteApi.control(selectedGuildId, "volume", vol);
  }, [isLoggedIn, isMuted, selectedGuildId]);

  const toggleMute = useCallback(() => {
    if (!isLoggedIn) return;
    setIsMuted((prev) => {
      const next = !prev;
      igniteApi.control(selectedGuildId, "volume", next ? 0 : volume);
      return next;
    });
  }, [isLoggedIn, selectedGuildId, volume]);

  const toggleRepeat = useCallback(() => {
    if (!isLoggedIn) return;
    setRepeatMode((prev) => {
      let next: "off" | "track" | "queue" = "off";
      if (prev === "off") next = "track";
      else if (prev === "track") next = "queue";
      igniteApi.control(selectedGuildId, "loop", next);
      return next;
    });
  }, [isLoggedIn, selectedGuildId]);

  const toggleShuffle = useCallback(() => {
    if (!isLoggedIn) return;
    setShuffle((prev) => {
      const next = !prev;
      igniteApi.control(selectedGuildId, "shuffle");
      return next;
    });
  }, [isLoggedIn, selectedGuildId]);

  const toggleAutoplay = useCallback(() => {
    if (!isLoggedIn) return;
    setAutoplay((prev) => {
      const next = !prev;
      igniteApi.control(selectedGuildId, "autoplay");
      return next;
    });
  }, [isLoggedIn, selectedGuildId]);

  const setFilter = useCallback((name: string) => {
    if (!isLoggedIn) return;
    const filterKey = name === "none" ? null : name;
    setCurrentFilter(filterKey);
    igniteApi.control(selectedGuildId, "filter", name);

    const filterLabel = AUDIO_FILTER_LABELS[name as keyof typeof AUDIO_FILTER_LABELS] || name;
    if (!filterKey) {
      toast("Filtros de audio desactivados.", "info", { duration: 2500 });
    } else {
      toast(`Efecto "${filterLabel}" activado en Discord.`, "info", { duration: 3000 });
    }

    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "music_play",
        title: "Filtro de Audio",
        description: filterKey ? `Efecto '${filterLabel}' activado` : "Filtros de audio desactivados",
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
  }, [isLoggedIn, selectedGuildId, toast]);

  const stopPlayback = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("stop");
    try {
      const res = await igniteApi.control(selectedGuildId, "stop");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo detener el reproductor.", "error");
      } else {
        setIsBotOnline(true);
        setCurrentSong(null);
        setIsPlaying(false);
        setQueue([]);
        setCurrentTime(0);
        toast("Reproductor detenido y bot desconectado del canal de voz.", "info", { duration: 3500 });
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "voice_trigger",
            title: "Reproductor Detenido",
            description: "Reproducción finalizada y bot desconectado del canal de voz",
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
      }
      await syncPlayerState();
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el servicio del bot.", "error");
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, selectedGuildId, syncPlayerState, toast]);

  const importUrlSong = useCallback(async (url: string, opts?: { skip?: boolean; next?: boolean }) => {
    if (!isLoggedIn) {
      return { success: false, message: "Debes iniciar sesión con Discord para reproducir canciones." };
    }
    const trimmed = url.trim();
    if (!trimmed) {
      return { success: false, message: "Por favor introduce un enlace o nombre válido." };
    }
    if (trimmed.toLowerCase().includes("soundcloud.com")) {
      return { success: false, message: "SoundCloud ya no está soportado. Usa un enlace de YouTube o Spotify, o busca por nombre." };
    }

    const voiceCheck = await checkVoiceRequirement();
    if (!voiceCheck.canPlay) {
      return { success: false, message: voiceCheck.reason || "El bot de música no está disponible." };
    }

    setPendingAction(opts?.next ? "playNext" : "queue");
    setIsPlayerBusy(true);

    try {
      const res = await igniteApi.play(selectedGuildId, {
        query: trimmed,
        voiceChannelId: currentVoiceChannelId || undefined,
        userId: user?.id || undefined,
        skip: opts?.skip ?? false,
        next: opts?.next ?? false,
      });

      if (res.success && res.song) {
        setIsBotOnline(true);
        const msg = opts?.next
          ? `¡"${res.song.title}" se reproducirá a continuación!`
          : res.playlist
          ? `Playlist "${res.playlist.name || 'Lista'}" (${res.playlist.count} temas) añadida a la cola.`
          : `"${res.song.title}" añadida a la cola exitosamente!`;
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "music_play",
            title: opts?.next ? "Siguiente en cola" : "Pista Encolada",
            description: `'${res.song?.title}' ${opts?.next ? "se reproducirá a continuación" : "enviada al bot"}`,
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
        await syncPlayerState();
        return {
          success: true,
          message: msg,
          song: res.song,
        };
      } else if (!res.success) {
        if (!res.error?.includes("canal de voz")) {
          setIsBotOnline(false);
        }
        const errMsg = res.error || "El servicio del bot está desconectado o no responde.";
        toast(errMsg, "error");
        return {
          success: false,
          message: errMsg,
        };
      }

      // Fallback local mock handling if API didn't return song
      let source: Song["source"] = "youtube";
      let title = trimmed;
      let artist = "Desconocido";
      let albumArt = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";

      const lower = trimmed.toLowerCase();
      if (lower.includes("spotify.com")) {
        source = "spotify";
        title = "Spotify Track";
        artist = "Spotify Artist";
        albumArt = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80";
      } else if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
        source = "youtube";
        title = "YouTube Video Audio";
        artist = "YouTube Content";
        albumArt = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80";
      }

      const newSong: Song = {
        id: "imported-" + Date.now(),
        title,
        artist,
        albumArt,
        duration: 210,
        source,
        url: trimmed,
        category: "hits",
        requestedBy: user
          ? { id: user.id, username: user.username, avatar: user.avatar || null }
          : null,
      };

      setQueue((prev) => [...prev, newSong]);
      await syncPlayerState();

      return {
        success: true,
        message: `¡"${title}" añadida a la cola!`,
        song: newSong,
      };
    } catch (err: any) {
      setIsBotOnline(false);
      const errMsg = err?.message || "Error al encolar la canción.";
      toast(errMsg, "error");
      return {
        success: false,
        message: errMsg,
      };
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isLoggedIn, checkVoiceRequirement, selectedGuildId, currentVoiceChannelId, user, syncPlayerState, toast]);

  const sendTTS = useCallback((text: string, voice: string, pitch: number, rate: number) => {
    if (!isLoggedIn || !text.trim()) return;

    // Trigger audible speech in browser
    audioSynth.speakTTS(text, voice, rate, pitch);

    const newMessage: TTSMessage = {
      id: "tts-" + Date.now(),
      text,
      voice,
      pitch,
      rate,
      channelName: currentVoiceChannel ? currentVoiceChannel.name : "Canal de Voz",
      timestamp: "Ahora mismo",
    };

    setRecentTTS((prev) => [newMessage, ...prev.slice(0, 9)]);
    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "tts",
        title: "TTS Reproducido",
        description: `'${text.slice(0, 40)}${text.length > 40 ? "..." : ""}' emitido con voz ${voice}`,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
  }, [isLoggedIn, currentVoiceChannel]);

  const playSound = useCallback((soundId: string) => {
    if (!isLoggedIn) return;
    const sound = sounds.find((s) => s.id === soundId);
    if (!sound) return;

    setActiveSoundId(soundId);
    // Sin preview local: el sonido solo se emite en Discord.

    setTimeout(() => {
      setActiveSoundId(null);
    }, sound.duration * 1000);

    // Update play count y timestamp de uso reciente (optimista)
    const now = Date.now();
    saveStoredRecentPlayed(soundId, now);
    setSounds((prev) =>
      prev.map((s) => (s.id === soundId ? { ...s, playsCount: s.playsCount + 1, lastPlayedAt: now } : s))
    );

    const channelName = currentVoiceChannel?.name || "General";

    // Emisión en Discord (fire-and-forget, no bloquea la UI).
    // Sin archivo en el bot (code NO_AUDIO_FILE) no sonará nada:
    // hay que subir el .mp3 con el icono de subida del pad.
    soundApi
      .playSoundOnDiscord({
        guildId: selectedGuildId,
        channelId: currentVoiceChannel?.id,
        soundId,
        volume,
      })
      .then((res) => {
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "soundboard",
            title: res.success ? "Soundboard en Discord" : "No se pudo emitir",
            description: res.success
              ? `Efecto ${sound.emoji || "🔊"} '${sound.name}' emitido en ${res.channel?.name || channelName}`
              : res.code === "NO_AUDIO_FILE"
                ? `Efecto ${sound.emoji || "🔊"} '${sound.name}' sin audio en el bot — súbelo con el icono ⬆️ del pad`
                : res.error || "No se pudo emitir el sonido en Discord",
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
      })
      .catch(() => {
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "soundboard",
            title: "No se pudo emitir",
            description: `Efecto ${sound.emoji || "🔊"} '${sound.name}' — bot no alcanzable`,
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
      });
  }, [isLoggedIn, sounds, currentVoiceChannel, selectedGuildId, volume]);

  const addCustomSound = useCallback(async (soundData: {
    name: string;
    emoji?: string;
    category: SoundItem["category"];
    file?: File;
    scope?: "mine" | "all";
  }) => {
    const isMine = soundData.scope !== "all";
    const uploadedBy = isMine ? (user?.id || "750899475404292126") : null;
    const now = Date.now();

    // Con archivo: subida real al bot (sonará en Discord). Sin archivo: solo local (preview synth).
    if (soundData.file) {
      const res = await soundApi.uploadSound({
        name: soundData.name,
        emoji: soundData.emoji,
        category: soundData.category,
        file: soundData.file,
        userId: uploadedBy || undefined,
      });
      if (!res.success || !res.sound) {
        toast(res.error || "No se pudo subir el sonido al catálogo.", "error");
        return false;
      }
      const s = res.sound;
      const newSound: SoundItem = {
        id: s.id,
        name: s.name,
        emoji: s.emoji || soundData.emoji || "🎵",
        category: (s.category as SoundItem["category"]) || soundData.category,
        duration: s.duration ?? 2,
        preset: "tada",
        playsCount: s.playsCount ?? 0,
        hasFile: true,
        uploadedBy: uploadedBy,
        lastPlayedAt: now,
      };
      saveStoredSoundScope(newSound.id, isMine ? "mine" : "all");
      saveStoredRecentPlayed(newSound.id, now);
      setSounds((prev) => [newSound, ...prev]);
      toast(`Sonido "${newSound.name}" subido correctamente al catálogo.`, "success", {
        duration: 3500,
      });
      return true;
    }

    const newSound: SoundItem = {
      id: "snd-" + Date.now(),
      name: soundData.name,
      emoji: soundData.emoji || "🎵",
      category: soundData.category,
      duration: 2,
      preset: "tada",
      playsCount: 0,
      hasFile: false,
      uploadedBy: uploadedBy,
      lastPlayedAt: now,
    };
    saveStoredSoundScope(newSound.id, isMine ? "mine" : "all");
    saveStoredRecentPlayed(newSound.id, now);
    setSounds((prev) => [newSound, ...prev]);
    toast(`Sonido "${newSound.name}" guardado en el catálogo local.`, "success", {
      duration: 3000,
    });
    return true;
  }, [user?.id, toast]);

  const editCustomSound = useCallback(async (
    soundId: string,
    data: {
      name: string;
      emoji?: string;
      category: SoundItem["category"];
      scope?: "mine" | "all";
      uploadedBy?: string | null;
    }
  ) => {
    const trimmed = data.name.trim();
    if (!trimmed) return false;

    const newUploadedBy = data.uploadedBy !== undefined
      ? data.uploadedBy
      : data.scope !== undefined
      ? (data.scope === "all" ? null : (user?.id || "750899475404292126"))
      : undefined;

    if (data.scope !== undefined) {
      saveStoredSoundScope(soundId, data.scope);
    } else if (newUploadedBy !== undefined) {
      saveStoredSoundScope(soundId, newUploadedBy ? "mine" : "all");
    }

    const res = await soundApi.updateSound(soundId, {
      name: trimmed,
      emoji: data.emoji?.trim() || undefined,
      category: data.category,
      uploadedBy: newUploadedBy,
    });

    if (!res.success && !sounds.some((s) => s.id === soundId)) {
      const errMsg = res.error || "No se pudo actualizar el sonido.";
      toast(errMsg, "error");
      setLiveEvents((prev) => [
        {
          id: "evt-" + Date.now(),
          type: "soundboard",
          title: "Error al editar",
          description: errMsg,
          timestamp: "Ahora mismo",
        },
        ...prev.slice(0, 19),
      ]);
      return false;
    }

    const s = res.sound;
    setSounds((prev) =>
      prev.map((x) =>
        x.id === soundId
          ? {
              ...x,
              name: s?.name || trimmed,
              emoji: s?.emoji || data.emoji?.trim() || x.emoji,
              category: (s?.category as SoundItem["category"]) || data.category,
              uploadedBy: newUploadedBy !== undefined ? newUploadedBy : (s?.uploadedBy ?? x.uploadedBy),
            }
          : x
      )
    );
    toast(`Sonido "${trimmed}" actualizado correctamente.`, "success", { duration: 2500 });
    return true;
  }, [user?.id, sounds, toast]);

  const deleteCustomSound = useCallback(async (soundId: string) => {
    const target = sounds.find((s) => s.id === soundId);
    if (!target) return false;

    saveStoredSoundScope(soundId, null);
    saveStoredRecentPlayed(soundId, 0);

    try {
      await soundApi.deleteSound(soundId);
    } catch (e) {
      console.warn("deleteSound API error:", e);
    }

    setSounds((prev) => prev.filter((s) => s.id !== soundId));
    setPhraseTriggers((prev) => prev.filter((t) => t.soundId !== soundId));

    toast(`Sonido "${target.name}" eliminado del catálogo.`, "success", { duration: 3000 });
    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "soundboard",
        title: "Sonido Eliminado",
        description: `Se eliminó el sonido '${target.name}' del soundboard.`,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
    return true;
  }, [sounds, toast]);

  const attachSoundAudio = useCallback(async (soundId: string, file: File) => {
    if (!isLoggedIn) return false;
    const res = await soundApi.attachSoundFile(soundId, file);
    if (!res.success || !res.sound) {
      const errMsg = res.error || "No se pudo adjuntar el audio al sonido.";
      toast(errMsg, "error");
      setLiveEvents((prev) => [
        {
          id: "evt-" + Date.now(),
          type: "soundboard",
          title: "Error al subir audio",
          description: errMsg,
          timestamp: "Ahora mismo",
        },
        ...prev.slice(0, 19),
      ]);
      return false;
    }
    const s = res.sound;
    setSounds((prev) =>
      prev.map((x) =>
        x.id === soundId
          ? {
              ...x,
              duration: s.duration ?? x.duration,
              playsCount: s.playsCount ?? x.playsCount,
              hasFile: true,
            }
          : x
      )
    );
    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "soundboard",
        title: "Audio adjuntado",
        description: `'${s.name}' ahora tiene audio real y sonará en Discord 🔊`,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
    toast(`Audio adjuntado a "${s.name}" correctamente.`, "success", { duration: 3500 });
    return true;
  }, [isLoggedIn, toast]);

  const addPhraseTrigger = useCallback((data: { phrase: string; soundId: string; exactMatch: boolean; channelTarget: string }) => {
    if (!isLoggedIn) return;
    const targetSound = sounds.find((s) => s.id === data.soundId);
    if (!targetSound) return;

    const newTrigger: PhraseTrigger = {
      id: "trg-" + Date.now(),
      phrase: data.phrase,
      soundId: data.soundId,
      soundName: targetSound.name,
      soundEmoji: targetSound.emoji,
      exactMatch: data.exactMatch,
      enabled: true,
      channelTarget: data.channelTarget,
      triggerCount: 0,
    };

    setPhraseTriggers((prev) => [newTrigger, ...prev]);
  }, [isLoggedIn, sounds]);

  const togglePhraseTrigger = useCallback((id: string) => {
    if (!isLoggedIn) return;
    setPhraseTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, [isLoggedIn]);

  const deletePhraseTrigger = useCallback((id: string) => {
    if (!isLoggedIn) return;
    setPhraseTriggers((prev) => prev.filter((t) => t.id !== id));
  }, [isLoggedIn]);

  const simulatePhraseDetection = useCallback((triggerId: string) => {
    if (!isLoggedIn) return;
    const trigger = phraseTriggers.find((t) => t.id === triggerId);
    if (!trigger || !trigger.enabled) return;

    playSound(trigger.soundId);

    setPhraseTriggers((prev) =>
      prev.map((t) =>
        t.id === triggerId
          ? { ...t, triggerCount: t.triggerCount + 1, lastTriggered: "Ahora mismo" }
          : t
      )
    );

    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "voice_trigger",
        title: "Disparador de Frase Detectado",
        description: `Alguien dijo '${trigger.phrase}' en Discord ➜ Sonido ${trigger.soundEmoji || "🔊"} ${trigger.soundName}`,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
  }, [phraseTriggers, playSound]);

  const clearLiveEvents = useCallback(() => {
    setLiveEvents([]);
  }, []);

  return (
    <BotContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoadingAuth,
        loginDiscord,
        logoutDiscord,
        guilds,
        selectedGuildId,
        selectedGuild,
        setSelectedGuildId,
        isVoiceConnected,
        currentVoiceChannel,
        setVoiceConnection,
        isBotOnline,

        catalog,
        queue,
        currentSong,
        isPlaying,
        currentTime,
        volume,
        isMuted,
        repeatMode,
        shuffle,
        playSong,
        playNext,
        addToQueue,
        removeFromQueue,
        moveQueueSong,
        jumpToQueueSong,
        clearQueue,
        togglePlayPause,
        skipNext,
        skipPrevious,
        seekTo,
        setVolumeLevel,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        stopPlayback,
        autoplay,
        toggleAutoplay,
        currentFilter,
        setFilter,
        defaultProvider,
        setDefaultProvider,
        importUrlSong,

        favorites,
        isLoadingFavorites,
        isFavorite,
        toggleFavorite,
        importPlaylistToFavorites,
        playFavorites,

        isPlayerBusy,
        pendingAction,
        loadingSongId,
        removingSongId,
        isSkipping,
        isTogglingPlay,
        isAddingToQueue,
        isReordering,
        syncPlayerState,

        recentTTS,
        sendTTS,

        sounds,
        phraseTriggers,
        liveEvents,
        activeSoundId,
        playSound,
        addCustomSound,
        editCustomSound,
        deleteCustomSound,
        attachSoundAudio,
        addPhraseTrigger,
        togglePhraseTrigger,
        deletePhraseTrigger,
        simulatePhraseDetection,
        clearLiveEvents,
      }}
    >
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error("useBot must be used within a BotProvider");
  }
  return context;
}
