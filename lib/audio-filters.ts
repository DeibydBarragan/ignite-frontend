// Espejo de los filtros del bot (ignite-music: src/ui/views.js FILTERS/FILTER_LABELS).
// Mantener sincronizado si se añaden filtros en Discord.
export const AUDIO_FILTERS = [
  "bassboost",
  "nightcore",
  "vaporwave",
  "3d",
  "karaoke",
  "echo",
  "surround",
  "tremolo",
] as const;

export type AudioFilterName = (typeof AUDIO_FILTERS)[number];

export const AUDIO_FILTER_LABELS: Record<AudioFilterName, string> = {
  bassboost: "Bass Boost",
  nightcore: "Nightcore",
  vaporwave: "Vaporwave",
  "3d": "8D",
  karaoke: "Karaoke",
  echo: "Echo",
  surround: "Surround",
  tremolo: "Tremolo",
};
