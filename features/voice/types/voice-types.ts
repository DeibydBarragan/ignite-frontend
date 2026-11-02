export type VoiceCommandId =
  | "play"
  | "play_next"
  | "enqueue"
  | "skip"
  | "pause"
  | "resume"
  | "stop"
  | "previous"
  | "shuffle"
  | "autoplay_on"
  | "autoplay_off"
  | "volume"
  | "queue"
  | "hola_que_hace";

export interface VoiceBinding {
  phrase: string;
  command_id: VoiceCommandId;
}

export interface GuildVoiceSettings {
  enabled: boolean;
  wake_word: string;
  language: string;
  tts_feedback_enabled: boolean;
  tts_voice?: string;
  tts_pitch?: number;
  tts_rate?: number;
  tts_templates: Record<string, string>;
  bindings: VoiceBinding[];
}

export interface VoiceCommandDefinition {
  id: VoiceCommandId;
  label: string;
  description: string;
  requiresParam: boolean;
  paramPlaceholder?: string;
  defaultPhrases: string[];
  defaultTemplate: string;
}

export const VOICE_COMMANDS: VoiceCommandDefinition[] = [
  {
    id: "play",
    label: "Reproducir ahora (saltando la actual)",
    description: "Busca y reproduce inmediatamente, saltando la canción en reproducción.",
    requiresParam: true,
    paramPlaceholder: "ej. Bohemian Rhapsody, link de Spotify o YouTube",
    defaultPhrases: ["reproduce", "reproducir", "pon", "poner", "toca", "tocar"],
    defaultTemplate: "Reproduciendo {query}",
  },
  {
    id: "play_next",
    label: "Poner a continuación (después de la actual)",
    description: "Inserta la canción justo después de la que está sonando ahora mismo.",
    requiresParam: true,
    paramPlaceholder: "ej. Numb, título de canción",
    defaultPhrases: [
      "pon despues",
      "reproduce despues",
      "pon a continuacion",
      "añade a continuacion",
      "toca despues",
      "play next",
    ],
    defaultTemplate: "Añadida {query} a continuación",
  },
  {
    id: "enqueue",
    label: "Añadir al final de la cola",
    description: "Agrega una canción al final de toda la lista de reproducción.",
    requiresParam: true,
    paramPlaceholder: "ej. Starboy, nombre de canción",
    defaultPhrases: ["agrega", "agregar", "añade", "añadir", "encola"],
    defaultTemplate: "Añadida {query} a la lista",
  },
  {
    id: "skip",
    label: "Saltar canción",
    description: "Pasa a la siguiente canción en la lista.",
    requiresParam: false,
    defaultPhrases: ["siguiente", "salta", "saltar", "pasa", "skip"],
    defaultTemplate: "Saltando canción",
  },
  {
    id: "pause",
    label: "Pausar música",
    description: "Pone en pausa la reproducción actual.",
    requiresParam: false,
    defaultPhrases: ["pausa", "pausar", "espera"],
    defaultTemplate: "Música pausada",
  },
  {
    id: "resume",
    label: "Reanudar música",
    description: "Reanuda la canción pausada.",
    requiresParam: false,
    defaultPhrases: ["continua", "continuar", "reanuda", "reanudar", "sigue", "dale"],
    defaultTemplate: "Reanudando música",
  },
  {
    id: "stop",
    label: "Detener y desconectar",
    description: "Detiene la música, vacía la lista y desconecta el bot.",
    requiresParam: false,
    defaultPhrases: ["deten", "detén", "detener", "apaga", "apagar", "stop"],
    defaultTemplate: "Reproducción detenida",
  },
  {
    id: "previous",
    label: "Canción anterior",
    description: "Regresa a la canción previa del historial.",
    requiresParam: false,
    defaultPhrases: ["anterior", "atras", "atrás", "regresa", "volver"],
    defaultTemplate: "Canción anterior",
  },
  {
    id: "shuffle",
    label: "Mezclar lista (Aleatorio)",
    description: "Baraja aleatoriamente el orden de las canciones en la cola.",
    requiresParam: false,
    defaultPhrases: ["mezcla", "mezclar", "aleatorio", "random", "shuffle"],
    defaultTemplate: "Lista en modo aleatorio",
  },
  {
    id: "autoplay_on",
    label: "Activar autoplay",
    description: "Activa el modo autoplay: al acabar la lista, sigue con canciones relacionadas.",
    requiresParam: false,
    defaultPhrases: ["activa autoplay", "activa el autoplay", "enciende autoplay", "prende autoplay", "activa la reproduccion automatica"],
    defaultTemplate: "Autoplay activado",
  },
  {
    id: "autoplay_off",
    label: "Desactivar autoplay",
    description: "Desactiva el modo autoplay: al acabar la lista, la música se detiene.",
    requiresParam: false,
    defaultPhrases: ["desactiva autoplay", "desactiva el autoplay", "apaga autoplay", "quita autoplay", "desactiva la reproduccion automatica"],
    defaultTemplate: "Autoplay desactivado",
  },
  {
    id: "volume",
    label: "Ajustar volumen",
    description: "Modifica el volumen de reproducción (0 a 100%).",
    requiresParam: true,
    paramPlaceholder: "ej. 80, 50, 100",
    defaultPhrases: ["volumen al", "volumen a", "volumen"],
    defaultTemplate: "Volumen ajustado al {query}",
  },
  {
    id: "queue",
    label: "Ver cola de canciones",
    description: "Muestra la lista de canciones en espera.",
    requiresParam: false,
    defaultPhrases: ["cola", "lista", "fila", "canciones"],
    defaultTemplate: "Mostrando la lista",
  },
  {
    id: "hola_que_hace",
    label: "Saludo (Hola que hace)",
    description: "Saluda al bot diciendo 'Hola que hace' y el bot responderá 'Hola que hace'.",
    requiresParam: false,
    defaultPhrases: [
      "hola que hace",
      "hola que haces",
      "hola ke hace",
      "hola ke haces",
      "ola que hace",
      "ola que haces",
      "ola k ase",
      "hola k ase",
      "ola k hace",
      "hola q hace",
      "hola q haces",
    ],
    defaultTemplate: "Hola que hace",
  },
];

export interface VoiceLogEntry {
  id: string;
  timestamp: string;
  guildId: string;
  userId?: string | null;
  audioBytes: number;
  voskHeard: string;
  wakeWordSpotted: boolean;
  matchedWakeWord?: string | null;
  gateReason?: string | null;
  groqEngaged: boolean;
  groqText?: string | null;
  groqElapsedMs?: number | null;
  commandId?: string | null;
  query?: string | null;
  ttsMessage?: string | null;
  status: string;
}
