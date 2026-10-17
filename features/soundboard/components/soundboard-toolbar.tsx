"use client";

import type { SoundCategory } from "@/types/domain";
import { GlassSelect } from "@/components/ui/glass-select";
import { Plus, Search, Clock } from "lucide-react";

export type SoundScope = "all" | "mine" | "public";
export type SoundSort = "recent" | "popular" | "alpha";

export interface SoundboardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: "all" | SoundCategory;
  onCategoryChange: (category: "all" | SoundCategory) => void;
  scope: SoundScope;
  onScopeChange: (scope: SoundScope) => void;
  sortBy: SoundSort;
  onSortChange: (sort: SoundSort) => void;
  counts: { all: number; mine: number; public: number };
  onAddSound: () => void;
}

const CATEGORIES: { id: "all" | SoundCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "memes", label: "Memes" },
  { id: "gaming", label: "Gaming" },
  { id: "reactions", label: "Reacciones" },
  { id: "sfx", label: "Efectos" },
  { id: "anime", label: "Anime" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes", icon: <Clock size={12} className="text-purple-400" /> },
  { value: "popular", label: "Más usados", icon: <Clock size={12} className="text-purple-400" /> },
  { value: "alpha", label: "A - Z", icon: <Clock size={12} className="text-purple-400" /> },
];

export function SoundboardToolbar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  scope,
  onScopeChange,
  sortBy,
  onSortChange,
  counts,
  onAddSound,
}: SoundboardToolbarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            Soundboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Haz clic sobre cualquier pad para emitir el efecto al canal de voz.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAddSound}
            className="glass-btn px-3 py-1.5 text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-500 border-purple-500/20"
          >
            <Plus size={14} />
            <span>Añadir sonido</span>
          </button>
        </div>
      </div>

      {/* Scope tabs: Todos / Propios / De todos */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onScopeChange("all")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            scope === "all"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Todos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-400 font-mono">
            {counts.all}
          </span>
        </button>
        <button
          onClick={() => onScopeChange("mine")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            scope === "mine"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Propios</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-mono font-bold">
            {counts.mine}
          </span>
        </button>
        <button
          onClick={() => onScopeChange("public")}
          className={`glass-pill px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            scope === "public"
              ? "glass-pill-active font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>De todos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/15 text-blue-400 font-mono font-bold">
            {counts.public}
          </span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`glass-pill px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat.id ? "glass-pill-active" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sonido..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="w-36 shrink-0" title="Ordenar audios">
            <GlassSelect
              value={sortBy}
              onChange={(val) => onSortChange(val as SoundSort)}
              options={SORT_OPTIONS}
              size="sm"
              className="h-8 py-1 px-2.5"
            />
          </div>
        </div>
      </div>
    </>
  );
}
