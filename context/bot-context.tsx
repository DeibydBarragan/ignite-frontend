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
  importUrlSong: (url: string) => Promise<{ success: boolean; message: string; song?: Song }>;

  // Loading & Action Locking States
  isPlayerBusy: boolean;
  pendingAction: "skip" | "previous" | "toggle" | "play" | "queue" | "clear" | null;
  loadingSongId: string | null;
  removingSongId: string | null;
  isSkipping: boolean;
  isTogglingPlay: boolean;
  isAddingToQueue: boolean;
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
  const [guilds, setGuilds] = useState<DiscordGuild[]>([
    {
      id: "1011718919473610863",
      name: "Perros mierda",
      icon: "https://cdn.discordapp.com/icons/1011718919473610863/b5185e31fae4e960f46cd4d222d28801.webp",
      memberCount: 23,
      botPresent: true,
      voiceChannels: [
        { id: "1012424911110799370", name: "La  Perrera", userCount: 1, bitrate: 64 },
      ],
    },
    ...MOCK_GUILDS,
  ]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID || "1011718919473610863"
  );
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(true);
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<string>("1012424911110799370");

  // Music State
  const [catalog] = useState<Song[]>(MOCK_SONGS);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
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

  // Loading & Action locking state
  const [isPlayerBusy, setIsPlayerBusy] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"skip" | "previous" | "toggle" | "play" | "queue" | "clear" | null>(null);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);

  const isSkipping = pendingAction === "skip";
  const isTogglingPlay = pendingAction === "toggle";
  const isAddingToQueue = pendingAction === "queue";

  // Real-time synchronization with Bot REST API
  const syncPlayerState = useCallback(async () => {
    try {
      const state = await igniteApi.getPlayerState(selectedGuildId);
      if (!state) return;

      if (state.hasQueue && state.currentSong) {
        setCurrentSong(state.currentSong);
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.currentTime);
        setVolume(state.volume);
        setRepeatMode(state.repeatMode);
        setQueue(state.queue);
        setIsVoiceConnected(true);
        if (state.voiceChannel) {
          setCurrentVoiceChannelId(state.voiceChannel.id);
        }
      } else if (!state.hasQueue) {
        setCurrentSong(null);
        setIsPlaying(false);
        setQueue([]);
        setCurrentTime(0);
      }
    } catch {
      // Fall back gracefully to local state
    }
  }, [selectedGuildId]);

  useEffect(() => {
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
  }, [syncPlayerState]);

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

  const playSong = useCallback(async (song: Song) => {
    if (isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("play");
    setLoadingSongId(song.id);
    try {
      setCurrentSong(song);
      setCurrentTime(0);
      setIsPlaying(true);
      await igniteApi.play(selectedGuildId, {
        query: song.url || `${song.title} ${song.artist}`,
        voiceChannelId: currentVoiceChannelId || undefined,
      });
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
    } catch (err) {
      console.error("Error playing song:", err);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
      setLoadingSongId(null);
    }
  }, [isPlayerBusy, selectedGuildId, currentVoiceChannelId, syncPlayerState]);

  const addToQueue = useCallback(async (song: Song) => {
    if (loadingSongId === song.id) return;
    setPendingAction("queue");
    setLoadingSongId(song.id);
    try {
      setQueue((prev) => [...prev, song]);
      await igniteApi.play(selectedGuildId, {
        query: song.url || `${song.title} ${song.artist}`,
        voiceChannelId: currentVoiceChannelId || undefined,
      });
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
    } catch (err) {
      console.error("Error adding to queue:", err);
    } finally {
      setPendingAction(null);
      setLoadingSongId(null);
    }
  }, [loadingSongId, selectedGuildId, currentVoiceChannelId, syncPlayerState]);

  const removeFromQueue = useCallback(async (songId: string) => {
    if (removingSongId === songId) return;
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
  }, [queue, removingSongId, selectedGuildId, syncPlayerState]);

  const clearQueue = useCallback(async () => {
    if (isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("clear");
    try {
      setQueue([]);
      await igniteApi.clearQueue(selectedGuildId);
      await syncPlayerState();
    } catch (err) {
      console.error("Error clearing queue:", err);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isPlayerBusy, selectedGuildId, syncPlayerState]);

  const togglePlayPause = useCallback(async () => {
    if (isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("toggle");
    setIsPlaying((prev) => !prev);
    try {
      await igniteApi.control(selectedGuildId, "toggle");
      await syncPlayerState();
    } catch (err) {
      console.error("Error toggling play/pause:", err);
      setIsPlaying((prev) => !prev);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isPlayerBusy, selectedGuildId, syncPlayerState]);

  const skipNext = useCallback(async () => {
    if (isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("skip");
    try {
      await igniteApi.control(selectedGuildId, "skip");
      await syncPlayerState();
    } catch (err) {
      console.error("Error skipping next:", err);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isPlayerBusy, selectedGuildId, syncPlayerState]);

  const skipPrevious = useCallback(async () => {
    if (isPlayerBusy) return;
    setIsPlayerBusy(true);
    setPendingAction("previous");
    try {
      await igniteApi.control(selectedGuildId, "previous");
      await syncPlayerState();
    } catch (err) {
      console.error("Error skipping previous:", err);
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [isPlayerBusy, selectedGuildId, syncPlayerState]);

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

  const importUrlSong = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { success: false, message: "Por favor introduce un enlace o nombre válido." };
    }

    setPendingAction("queue");
    setIsPlayerBusy(true);

    try {
      const res = await igniteApi.play(selectedGuildId, {
        query: trimmed,
        voiceChannelId: currentVoiceChannelId || undefined,
      });

      if (res.success && res.song) {
        setLiveEvents((prev) => [
          {
            id: "evt-" + Date.now(),
            type: "music_play",
            title: "Pista Encolada",
            description: `'${res.song?.title}' enviada al bot`,
            timestamp: "Ahora mismo",
          },
          ...prev.slice(0, 19),
        ]);
        await syncPlayerState();
        return {
          success: true,
          message: `¡'${res.song.title}' añadida a la cola exitosamente!`,
          song: res.song,
        };
      } else if (!res.success && res.error) {
        return {
          success: false,
          message: `Error al procesar: ${res.error}`,
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
      } else if (lower.includes("soundcloud.com")) {
        source = "soundcloud";
        title = "SoundCloud Track";
        artist = "SoundCloud Creator";
        albumArt = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";
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
      };

      setQueue((prev) => [...prev, newSong]);
      await syncPlayerState();

      return {
        success: true,
        message: `¡'${title}' añadida a la cola!`,
        song: newSong,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Error al encolar la canción.",
      };
    } finally {
      setIsPlayerBusy(false);
      setPendingAction(null);
    }
  }, [selectedGuildId, currentVoiceChannelId, syncPlayerState]);

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

        isPlayerBusy,
        pendingAction,
        loadingSongId,
        removingSongId,
        isSkipping,
        isTogglingPlay,
        isAddingToQueue,
        syncPlayerState,

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
