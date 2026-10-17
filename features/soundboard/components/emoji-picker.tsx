"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/use-mounted";
import type { EmojiGroup } from "@/lib/emoji-data";
import { EMOJI_GROUPS } from "@/lib/emoji-data";
import { EMOJI_KEYWORDS } from "@/lib/emoji-keywords";
import { EmojiPickerPanel } from "./emoji-picker-panel";
import { SmilePlus } from "lucide-react";

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [custom, setCustom] = useState("");
  const mounted = useMounted();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const DROPDOWN_WIDTH = 320;
    const DROPDOWN_MAX_HEIGHT = 380;
    const MARGIN = 10;

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
      const maxHeight = Math.max(200, Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove - MARGIN));
      setPositionStyle({
        position: "fixed",
        bottom: `${vh - rect.top + MARGIN}px`,
        left: `${left}px`,
        maxHeight: `${maxHeight}px`,
      });
    } else {
      const maxHeight = Math.max(200, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - MARGIN));
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
      setSearch("");
      setActiveCategory("all");
      setIsOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  const handlePick = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  const applyCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustom("");
    setIsOpen(false);
  };

  // Filtrado de emojis por búsqueda o categoría
  const filteredGroups = useMemo((): EmojiGroup[] => {
    const q = search.toLowerCase().trim();

    return EMOJI_GROUPS.map((group) => {
      // Si hay categoría activa y no es 'all', filtrar por categoría
      if (!q && activeCategory !== "all" && group.id !== activeCategory) {
        return { ...group, emojis: [] };
      }

      // Si no hay búsqueda, devolver todos los emojis del grupo
      if (!q) {
        return group;
      }

      // Filtrar emojis por texto de búsqueda
      const matching = group.emojis.filter((emoji) => {
        if (emoji.includes(q)) return true;
        if (group.label.toLowerCase().includes(q)) return true;
        const kw = EMOJI_KEYWORDS[emoji];
        if (kw && kw.toLowerCase().includes(q)) return true;
        return false;
      });

      return {
        ...group,
        emojis: matching,
      };
    }).filter((g) => g.emojis.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        title="Elegir emoji"
        className={`glass-input w-full h-10 px-3.5 flex items-center justify-between gap-2 cursor-pointer hover:border-purple-500/40 transition-colors ${
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
          <EmojiPickerPanel
            style={positionStyle}
            value={value}
            search={search}
            onSearchChange={setSearch}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            filteredGroups={filteredGroups}
            custom={custom}
            onCustomChange={setCustom}
            onPick={handlePick}
            onApplyCustom={applyCustom}
            onClear={() => handlePick("")}
            searchInputRef={searchInputRef}
          />
        </>,
        document.body
      )}
    </div>
  );
}
