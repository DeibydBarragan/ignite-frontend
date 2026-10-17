"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { igniteApi } from "@/lib/ignite-api";
import type { UserPlaylist } from "@/types/domain";
import {
  fetchUserPlaylists,
  createUserPlaylist,
  updatePlaylistSnapshot,
  deleteUserPlaylist,
} from "@/lib/playlists-service";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toast";
import type { PlaylistLiveState } from "@/types/music";

export function usePlaylists() {
  const { user, selectedGuildId } = useAuth();
  const { toast } = useToast();

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importUrl, setImportUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [selected, setSelected] = useState<UserPlaylist | null>(null);
  const [live, setLive] = useState<PlaylistLiveState | null>(null);
  const liveForRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUserPlaylists(user?.id);
        if (mounted) setPlaylists(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const showFeedback = (type: "success" | "error", message: string) => {
    toast(message, type);
  };

  // Importar = guardar SOLO el link (instantáneo, sin resolver)
  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = importUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showFeedback("error", "Pega un enlace válido de Spotify o YouTube.");
      return;
    }
    if (url.toLowerCase().includes("soundcloud.com")) {
      showFeedback("error", "SoundCloud ya no está soportado. Usa un enlace de Spotify o YouTube.");
      return;
    }
    if (playlists.some((p) => p.url.trim().toLowerCase() === url.toLowerCase())) {
      showFeedback("error", "Esa playlist ya está en tu colección.");
      return;
    }
    setIsImporting(true);
    try {
      const created = await createUserPlaylist({
        url,
        name: importName.trim() || undefined,
        userId: user?.id,
      });
      setPlaylists((prev) => [created, ...prev]);
      setImportUrl("");
      setImportName("");
      showFeedback("success", `Playlist "${created.name}" guardada. Ábrela para sincronizar sus temas.`);
    } catch {
      showFeedback("error", "No se pudo guardar la playlist.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const previous = playlists;
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setLive(null);
    }
    try {
      await deleteUserPlaylist(id);
      if (name) {
        showFeedback("success", `Playlist "${name}" eliminada.`);
      }
    } catch (err) {
      // Revertir optimista si Supabase falla (fin divergencia fantasma).
      setPlaylists(previous);
      logger.error("Error deleting playlist:", err);
      showFeedback("error", "No se pudo eliminar la playlist en Supabase.");
    }
  };

  // Abrir detalle = sincronizar con el estado ACTUAL de la plataforma
  const openPlaylist = async (pl: UserPlaylist) => {
    setSelected(pl);
    if (liveForRef.current === pl.id) return;
    liveForRef.current = pl.id;
    setLive({ playlistId: pl.id, status: "loading", tracks: [], truncated: false });
    try {
      const res = await igniteApi.resolvePlaylist(selectedGuildId, pl.url);
      if (!res.success || !res.tracks || res.tracks.length === 0) throw new Error("resolve failed");
      const cover = res.tracks[0]?.albumArt || pl.cover;
      await updatePlaylistSnapshot(pl.id, { tracks: res.tracks, cover });
      const synced_at = new Date().toISOString();
      setPlaylists((prev) =>
        prev.map((p) => (p.id === pl.id ? { ...p, tracks: res.tracks!, cover, synced_at } : p))
      );
      setSelected((prev) =>
        prev && prev.id === pl.id ? { ...prev, tracks: res.tracks!, cover, synced_at } : prev
      );
      setLive({ playlistId: pl.id, status: "ok", tracks: res.tracks, truncated: false });
    } catch {
      // Fallback: mostrar el último snapshot conocido
      setLive({ playlistId: pl.id, status: "error", tracks: [], truncated: false });
    }
  };

  const closeModal = () => {
    setSelected(null);
    setLive(null);
    liveForRef.current = null;
  };

  return {
    playlists,
    isLoading,
    importUrl,
    setImportUrl,
    importName,
    setImportName,
    isImporting,
    handleImport,
    handleDelete,
    selected,
    live,
    openPlaylist,
    closeModal,
  };
}
