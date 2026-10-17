"use client";

import type { EmojiGroup } from "@/lib/emoji-data";
import { EMOJI_GROUPS } from "@/lib/emoji-data";
import { Ban, Search, X } from "lucide-react";

export interface EmojiPickerPanelProps {
  style: React.CSSProperties;
  value: string;
  search: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  filteredGroups: EmojiGroup[];
  custom: string;
  onCustomChange: (value: string) => void;
  onPick: (emoji: string) => void;
  onApplyCustom: () => void;
  onClear: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EmojiPickerPanel({
  style,
  value,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  filteredGroups,
  custom,
  onCustomChange,
  onPick,
  onApplyCustom,
  onClear,
  searchInputRef,
}: EmojiPickerPanelProps) {
  return (
    <div
      style={style}
      className="glass-dropdown w-80 max-w-[calc(100vw-20px)] flex flex-col p-2.5 z-[10001] bg-white/55 dark:bg-[#12151f]/55 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl glass-modal-enter gap-2"
    >
      {/* Buscador de emojis */}
      <div className="relative shrink-0">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar (ej. risa, pato, trompeta...)"
          className="glass-input w-full pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-purple-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Pestañas de categorías rápidas (cuando no hay búsqueda activa) */}
      {!search && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px] shrink-0 border-b border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium ${
              activeCategory === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            ✨ Todos
          </button>
          {EMOJI_GROUPS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium ${
                activeCategory === cat.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {cat.icon} {cat.label.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Cuadrícula de emojis con scroll */}
      <div className="overflow-y-auto custom-scrollbar flex-1 max-h-56 pr-0.5 space-y-2.5">
        {filteredGroups.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <p>No se encontraron emojis para &ldquo;{search}&rdquo;</p>
            <button
              type="button"
              onClick={() => onPick(search.trim())}
              className="mt-2 px-3 py-1 rounded-lg bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-600/25 transition-colors"
            >
              Usar &ldquo;{search.trim()}&rdquo; como emoji
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>{group.label}</span>
                <span className="font-mono text-[9px] opacity-60 tabular-nums">
                  {group.emojis.length}
                </span>
              </p>
              <div className="grid grid-cols-8 gap-1">
                {[...new Set(group.emojis)].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onPick(emoji)}
                    title={emoji}
                    className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer hover:bg-purple-500/20 hover:scale-125 active:scale-95 ${
                      value === emoji
                        ? "bg-purple-500/25 ring-1.5 ring-purple-500 text-white"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pie: Pegar emoji personalizado o quitar */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1.5 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplyCustom();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={custom}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="O pega tu propio emoji…"
            maxLength={32}
            className="glass-input flex-1 min-w-0 px-2 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!custom.trim()}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            Usar
          </button>
        </form>

        <button
          type="button"
          onClick={onClear}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Ban size={12} />
          <span>Sin emoji</span>
        </button>
      </div>
    </div>
  );
}
