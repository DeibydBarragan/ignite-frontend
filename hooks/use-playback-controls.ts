"use client";

import { usePlaybackTransport, type PlaybackTransportValue } from "@/hooks/use-playback-transport";
import { usePlaybackMix, type PlaybackMixValue } from "@/hooks/use-playback-mix";

export interface PlaybackControlsValue extends PlaybackTransportValue, PlaybackMixValue {}

export function usePlaybackControls(): PlaybackControlsValue {
  const transport = usePlaybackTransport();
  const mix = usePlaybackMix();
  return { ...transport, ...mix };
}
