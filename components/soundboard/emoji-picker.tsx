"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [custom, setCustom] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const DROPDOWN_WIDTH = 256;
    const DROPDOWN_MAX_HEIGHT = 260;
    const MARGIN = 8;

    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    const placeAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + DROPDOWN_WIDTH > vw - MARGIN) {
      left = Math.max(MARGIN, vw - DROPDOWN_WIDTH - MARGIN);
    }
    if (left < MARGIN) {
      left = MARGIN;
    }

    if (placeAbove) {
      const maxHeight = Math.max(160, Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove - MARGIN));
      setPositionStyle({
        position: "fixed",
        bottom: `${vh - rect.top + MARGIN}px`,
        left: `${left}px`,
        maxHeight: `${maxHeight}px`,
      });
    } else {
      const maxHeight = Math.max(160, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - MARGIN));
      setPositionStyle({
        position: "fixed",
        top: `${rect.bottom + MARGIN}px`,
        left: `${left}px`,
        maxHeight: `${maxHeight}px`,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const applyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = custom.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustom("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        title="Elegir emoji"
        className={`glass-input w-full px-3.5 py-2 flex items-center justify-between gap-2 cursor-pointer hover:border-purple-500/40 transition-colors ${
          isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : ""
        }`}
      >
        <span className="text-xl leading-none">{value || "🎵"}</span>
        <SmilePlus size={15} className={`shrink-0 transition-colors ${isOpen ? "text-purple-500" : "text-slate-400"}`} />
      </button>

      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-[10000]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            style={positionStyle}
            className="glass-dropdown w-64 overflow-y-auto custom-scrollbar p-2.5 z-[10001] border border-black/10 dark:border-white/10 shadow-2xl space-y-2.5 glass-modal-enter"
          >
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
            <form
              onSubmit={applyCustom}
              className="flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/10"
            >
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="O pega tu propio emoji…"
                maxLength={32}
                className="glass-input flex-1 min-w-0 px-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!custom.trim()}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                Usar
              </button>
            </form>
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
        </>,
        document.body
      )}
    </div>
  );
}
