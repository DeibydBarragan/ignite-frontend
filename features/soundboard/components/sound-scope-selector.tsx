import { User, Globe } from "lucide-react";

export interface SoundScopeSelectorProps {
  scope: "mine" | "all";
  onChange: (scope: "mine" | "all") => void;
}

/** Selector de Pertenencia / Ámbito del sonido. */
export function SoundScopeSelector({ scope, onChange }: SoundScopeSelectorProps) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
        Pertenencia / Ámbito
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChange("mine")}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            scope === "mine"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30"
              : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
          }`}
        >
          <div className={`p-1.5 rounded-lg shrink-0 ${scope === "mine" ? "bg-emerald-500/20 text-emerald-500" : "bg-black/5 dark:bg-white/5 text-slate-400"}`}>
            <User size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              Propio (Mío)
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
              Aparece en &quot;Propios&quot;
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("all")}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            scope === "all"
              ? "border-purple-500/50 bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30"
              : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
          }`}
        >
          <div className={`p-1.5 rounded-lg shrink-0 ${scope === "all" ? "bg-purple-500/20 text-purple-400" : "bg-black/5 dark:bg-white/5 text-slate-400"}`}>
            <Globe size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              De todos (Público)
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
              Sonido global para el bot
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
