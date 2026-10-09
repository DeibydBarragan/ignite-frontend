"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  MOCK_USER,
  MOCK_GUILDS,
  MOCK_SONGS,
  MOCK_SOUNDS,
  MOCK_PHRASE_TRIGGERS,
  MOCK_INITIAL_EVENTS,
} from "@/lib/mock-data";
import { audioSynth } from "@/lib/audio-synth";
import { igniteApi } from "@/lib/ignite-api";

interface BotContextType {
  // Auth & Guild
  user: DiscordUser;
  isLoggedIn: boolean;
  loginDiscord: () => void;
  logoutDiscord: () => void;
  guilds: DiscordGuild[];
  selectedGuildId: string;
  selectedGuild: DiscordGuild;
  setSelectedGuildId: (id: string) => void;
  isVoiceConnected: boolean;
  currentVoiceChannel: VoiceChannel | null;
  setVoiceConnection: (connected: boolean, channelId?: string) => void;

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
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  defaultProvider: MusicSource;
  setDefaultProvider: (provider: MusicSource) => void;
  importUrlSong: (url: string) => { success: boolean; message: string; song?: Song };

  // TTS
  recentTTS: TTSMessage[];
  sendTTS: (text: string, voice: string, pitch: number, rate: number) => void;

  // Soundboard & Phrases
  sounds: SoundItem[];
  phraseTriggers: PhraseTrigger[];
  liveEvents: LiveEvent[];
  activeSoundId: string | null;
  playSound: (soundId: string) => void;
  addCustomSound: (sound: { name: string; emoji?: string; category: SoundItem["category"] }) => void;
  addPhraseTrigger: (trigger: { phrase: string; soundId: string; exactMatch: boolean; channelTarget: string }) => void;
  togglePhraseTrigger: (id: string) => void;
  deletePhraseTrigger: (id: string) => void;
  simulatePhraseDetection: (triggerId: string) => void;
  clearLiveEvents: () => void;
}

const BotContext = createContext<BotContextType | null>(null);

export function BotProvider({ children }: { children: React.ReactNode }) {
  // User & Guild State
  const [user, setUser] = useState<DiscordUser>(MOCK_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [guilds] = useState<DiscordGuild[]>(MOCK_GUILDS);
  const [selectedGuildId, setSelectedGuildId] = useState<string>(MOCK_GUILDS[0].id);
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(true);
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<string>("vc-1");

  // Music State
  const [catalog] = useState<Song[]>(MOCK_SONGS);
  const [queue, setQueue] = useState<Song[]>([MOCK_SONGS[1], MOCK_SONGS[2], MOCK_SONGS[3]]);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(34);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "track" | "queue">("off");
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [defaultProvider, setDefaultProvider] = useState<MusicSource>("spotify");

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

  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) || guilds[0];
  const currentVoiceChannel = isVoiceConnected
    ? selectedGuild.voiceChannels.find((vc) => vc.id === currentVoiceChannelId) || selectedGuild.voiceChannels[0] || null
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

  // Real-time synchronization with Bot REST API
  useEffect(() => {
    let isMounted = true;

    const syncPlayerState = async () => {
      try {
        const state = await igniteApi.getPlayerState(selectedGuildId);
        if (!isMounted || !state) return;

        if (state.hasQueue && state.currentSong) {
          setCurrentSong(state.currentSong);
          setIsPlaying(state.isPlaying);
          setCurrentTime(state.currentTime);
          setVolume(state.volume);
          setRepeatMode(state.repeatMode);
          setQueue(state.queue);
          setIsVoiceConnected(true);
        } else if (!state.hasQueue && isPlaying) {
          setIsPlaying(false);
        }
      } catch {
        // Fall back gracefully to local state
      }
    };

    const interval = setInterval(syncPlayerState, 2000);
    syncPlayerState();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedGuildId, isPlaying]);

  const loginDiscord = () => {
    setIsLoggedIn(true);
  };

  const logoutDiscord = () => {
    setIsLoggedIn(false);
  };

  const setVoiceConnection = (connected: boolean, channelId?: string) => {
    setIsVoiceConnected(connected);
    if (connected && channelId) {
      setCurrentVoiceChannelId(channelId);
    } else if (connected && !channelId && selectedGuild.voiceChannels.length > 0) {
      setCurrentVoiceChannelId(selectedGuild.voiceChannels[0].id);
    }
    setUser((prev) => ({
      ...prev,
      isVoiceConnected: connected,
      currentChannelId: connected ? channelId || selectedGuild.voiceChannels[0]?.id || null : null,
    }));
  };

  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setCurrentTime(0);
    setIsPlaying(true);
    igniteApi.play(selectedGuildId, { query: song.url || `${song.title} ${song.artist}` });
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
  }, [selectedGuildId]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    igniteApi.play(selectedGuildId, { query: song.url || `${song.title} ${song.artist}` });
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
  }, [selectedGuildId]);

  const removeFromQueue = useCallback((songId: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((s) => s.id === songId);
      if (idx !== -1) {
        igniteApi.removeFromQueue(selectedGuildId, idx + 1);
      }
      return prev.filter((s) => s.id !== songId);
    });
  }, [selectedGuildId]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    igniteApi.clearQueue(selectedGuildId);
  }, [selectedGuildId]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    igniteApi.control(selectedGuildId, "toggle");
  }, [selectedGuildId]);

  const skipNext = useCallback(() => {
    igniteApi.control(selectedGuildId, "skip");
  }, [selectedGuildId]);

  const skipPrevious = useCallback(() => {
    igniteApi.control(selectedGuildId, "previous");
  }, [selectedGuildId]);

  const seekTo = useCallback((seconds: number) => {
    if (currentSong) {
      const clamped = Math.max(0, Math.min(seconds, currentSong.duration));
      setCurrentTime(clamped);
      igniteApi.control(selectedGuildId, "seek", clamped);
    }
  }, [currentSong, selectedGuildId]);

  const setVolumeLevel = useCallback((vol: number) => {
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
    igniteApi.control(selectedGuildId, "volume", vol);
  }, [isMuted, selectedGuildId]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      igniteApi.control(selectedGuildId, "volume", next ? 0 : volume);
      return next;
    });
  }, [selectedGuildId, volume]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      let next: "off" | "track" | "queue" = "off";
      if (prev === "off") next = "track";
      else if (prev === "track") next = "queue";
      igniteApi.control(selectedGuildId, "loop", next);
      return next;
    });
  }, [selectedGuildId]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      igniteApi.control(selectedGuildId, "shuffle");
      return next;
    });
  }, [selectedGuildId]);

  const importUrlSong = useCallback((url: string) => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, message: "Por favor introduce un enlace válido." };
    }

    let source: Song["source"] = "youtube";
    let title = "Pista Importada";
    let artist = "Desconocido";
    let albumArt = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";

    if (trimmed.includes("spotify.com")) {
      source = "spotify";
      title = "Spotify Track · Lavamusic Stream";
      artist = "Spotify Artist";
      albumArt = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80";
    } else if (trimmed.includes("soundcloud.com")) {
      source = "soundcloud";
      title = "SoundCloud Remix Session";
      artist = "SoundCloud Creator";
      albumArt = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";
    } else if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
      source = "youtube";
      title = "YouTube Video Audio (Lavalink HQ)";
      artist = "YouTube Content";
      albumArt = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80";
    } else {
      // Búsqueda en texto plano: resuelve con el proveedor predeterminado
      source = defaultProvider;
      title = url.trim();
      artist = `Búsqueda en ${defaultProvider.toUpperCase()}`;
      albumArt =
        defaultProvider === "spotify"
          ? "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80"
          : defaultProvider === "youtube"
          ? "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80"
          : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";
    }

    const newSong: Song = {
      id: "imported-" + Date.now(),
      title,
      artist,
      albumArt,
      duration: 180 + Math.floor(Math.random() * 120),
      source,
      url,
      category: "gaming",
    };

    addToQueue(newSong);
    return {
      success: true,
      message: `¡Pista encolada vía ${source.toUpperCase()}!`,
      song: newSong,
    };
  }, [addToQueue, defaultProvider]);

  const sendTTS = useCallback((text: string, voice: string, pitch: number, rate: number) => {
    if (!text.trim()) return;

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
  }, [currentVoiceChannel]);

  const playSound = useCallback((soundId: string) => {
    const sound = sounds.find((s) => s.id === soundId);
    if (!sound) return;

    setActiveSoundId(soundId);
    // Play Web Audio synth sound
    audioSynth.playPreset(sound.preset);

    setTimeout(() => {
      setActiveSoundId(null);
    }, sound.duration * 1000);

    // Update play count
    setSounds((prev) =>
      prev.map((s) => (s.id === soundId ? { ...s, playsCount: s.playsCount + 1 } : s))
    );

    setLiveEvents((prev) => [
      {
        id: "evt-" + Date.now(),
        type: "soundboard",
        title: "Soundboard Play",
        description: `Efecto ${sound.emoji || "🔊"} '${sound.name}' reproducido en ${currentVoiceChannel?.name || "General"}`,
        timestamp: "Ahora mismo",
      },
      ...prev.slice(0, 19),
    ]);
  }, [sounds, currentVoiceChannel]);

  const addCustomSound = useCallback((soundData: { name: string; emoji?: string; category: SoundItem["category"] }) => {
    const newSound: SoundItem = {
      id: "snd-" + Date.now(),
      name: soundData.name,
      emoji: soundData.emoji || "🎵",
      category: soundData.category,
      duration: 2,
      preset: "tada",
      playsCount: 0,
    };
    setSounds((prev) => [newSound, ...prev]);
  }, []);

  const addPhraseTrigger = useCallback((data: { phrase: string; soundId: string; exactMatch: boolean; channelTarget: string }) => {
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
  }, [sounds]);

  const togglePhraseTrigger = useCallback((id: string) => {
    setPhraseTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const deletePhraseTrigger = useCallback((id: string) => {
    setPhraseTriggers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const simulatePhraseDetection = useCallback((triggerId: string) => {
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
        loginDiscord,
        logoutDiscord,
        guilds,
        selectedGuildId,
        selectedGuild,
        setSelectedGuildId,
        isVoiceConnected,
        currentVoiceChannel,
        setVoiceConnection,

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
        addToQueue,
        removeFromQueue,
        clearQueue,
        togglePlayPause,
        skipNext,
        skipPrevious,
        seekTo,
        setVolumeLevel,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        defaultProvider,
        setDefaultProvider,
        importUrlSong,

        recentTTS,
        sendTTS,

        sounds,
        phraseTriggers,
        liveEvents,
        activeSoundId,
        playSound,
        addCustomSound,
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
