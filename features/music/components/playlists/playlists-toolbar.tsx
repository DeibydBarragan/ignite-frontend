"use client";

import { Search, Link2, Plus, Loader2 } from "lucide-react";

export interface PlaylistsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  importUrl: string;
  onImportUrlChange: (value: string) => void;
  importName: string;
  onImportNameChange: (value: string) => void;
  isImporting: boolean;
  onImport: (e?: React.FormEvent) => void;
}

export function PlaylistsToolbar({
  search,
  onSearchChange,
  importUrl,
  onImportUrlChange,
  importName,
  onImportNameChange,
  isImporting,
  onImport,
}: PlaylistsToolbarProps) {
  return (
    <>
      {/* Buscador de playlists */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar en tus playlists por nombre, artista o canción..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Importar por link (solo se guarda el enlace) */}
      <form
        onSubmit={onImport}
        className="glass-panel p-3.5 border border-black/5 dark:border-white/10 space-y-2.5"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Link2 size={14} className="text-purple-400" />
          <span>Importar playlist por enlace</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2">
          <input
            type="text"
            placeholder="https://open.spotify.com/playlist/..."
            value={importUrl}
            onChange={(e) => onImportUrlChange(e.target.value)}
            disabled={isImporting}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={importName}
            onChange={(e) => onImportNameChange(e.target.value)}
            disabled={isImporting}
            maxLength={60}
            className="glass-input w-full px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!importUrl.trim() || isImporting}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Guardando</span>
              </>
            ) : (
              <>
                <Plus size={13} />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Solo se guarda el enlace: los temas siempre se sincronizan con el estado actual de la playlist. Usa el comando{" "}
          <span className="font-mono font-semibold text-purple-400">playlists</span> en el bot para verlas en Discord.
        </p>
      </form>
    </>
  );
}
