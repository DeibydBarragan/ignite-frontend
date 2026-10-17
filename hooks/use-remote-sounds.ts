"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { SoundItem } from "@/types/domain";
import { soundApi } from "@/lib/sound-api";
import {
  getStoredSoundScopes,
  getStoredRecentPlayed,
  mapRemoteSound,
} from "@/lib/sound-storage";

export function useRemoteSounds(
  isLoggedIn: boolean,
  setSounds: Dispatch<SetStateAction<SoundItem[]>>
) {
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const remote = await soundApi.getSounds();
        if (cancelled || !remote) return;
        const storedScopes = getStoredSoundScopes();
        const storedRecent = getStoredRecentPlayed();
        setSounds((prev) => {
          const merged = prev.map((s) => {
            const r = remote.find((x) => x.id === s.id);
            const overrideScope = storedScopes[s.id];
            let effectiveUploadedBy = r
              ? r.uploadedBy !== undefined
                ? r.uploadedBy
                : s.uploadedBy
              : s.uploadedBy;
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
      } catch {
        // Catálogo remoto no disponible: se conserva el catálogo local.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setSounds]);
}
