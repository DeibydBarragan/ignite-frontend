export type VoiceCommandId =
  | "play"
  | "enqueue"
  | "skip"
  | "pause"
  | "resume"
  | "stop"
  | "previous"
  | "shuffle"
  | "volume"
  | "queue";

export interface VoiceBinding {
  phrase: string;
  command_id: VoiceCommandId;
}

export interface GuildVoiceSettings {
  enabled: boolean;
  wake_word: string;
  language: string;
  tts_feedback_enabled: boolean;
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
    label: "Reproducir canción",
    description: "Busca y reproduce una canción o URL inmediatamente.",
    requiresParam: true,
    paramPlaceholder: "ej. Bohemian Rhapsody, link de Spotify o YouTube",
    defaultPhrases: ["reproduce", "reproducir", "pon", "poner", "toca", "tocar"],
    defaultTemplate: "Reproduciendo {query}",
  },
  {
    id: "enqueue",
    label: "Añadir a la cola",
    description: "Agrega una canción al final de la lista sin interrumpir la actual.",
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
    defaultPhrases: ["pausa", "pausar", "para", "espera"],
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
];
