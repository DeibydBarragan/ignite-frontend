"use client";

import { useState } from "react";
import { SmilePlus, Ban } from "lucide-react";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Caras",
    emojis: ["😀", "😁", "😂", "🤣", "😎", "🤩", "😭", "😡", "🤯", "🥳", "😱", "🤔", "😴", "🤖", "👻", "💀", "🤡", "😈"],
  },
  {
    label: "Gestos",
    emojis: ["👍", "👎", "👏", "🙌", "👋", "✌️", "🤝", "👊", "👀", "🧠", "❤️", "🔥", "⭐", "🎉", "💯", "🙏"],
  },
  {
    label: "Objetos",
    emojis: ["📢", "🎺", "🎻", "🥁", "🎸", "🎮", "🏆", "🚨", "🔔", "📯", "🎧", "🎤", "💣", "⏰", "🎯", "📣"],
  },
  {
    label: "Animales",
    emojis: ["🦆", "🐱", "🐶", "🦁", "🐸", "🐵", "🦄", "🐝", "🦖", "🐙", "🦊", "🐼"],
  },
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Elegir emoji"
        className="glass-input w-full px-3.5 py-2 flex items-center justify-between gap-2 cursor-pointer hover:border-purple-500/40 transition-colors"
      >
        <span className="text-xl leading-none">{value || "🎵"}</span>
        <SmilePlus size={15} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="glass-dropdown absolute left-0 mt-2 w-64 max-h-64 overflow-y-auto custom-scrollbar p-2.5 z-40 border border-black/10 dark:border-white/10 shadow-2xl space-y-2.5">
            {EMOJI_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {[...new Set(group.emojis)].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onChange(emoji);
                        setIsOpen(false);
                      }}
                      title={emoji}
                      className={`p-1 rounded-lg text-lg leading-none transition-all cursor-pointer hover:bg-purple-500/15 hover:scale-125 active:scale-95 ${
                        value === emoji ? "bg-purple-500/20 ring-1 ring-purple-500/50" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Ban size={12} />
              <span>Sin emoji</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
