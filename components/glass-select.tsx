"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  flag?: string;
  subtitle?: string;
}

export interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  size?: "sm" | "md";
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  disabled = false,
  title,
  size = "md",
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const MARGIN = 8;
    const DROPDOWN_MAX_HEIGHT = 280;
    const width = Math.max(rect.width, 160);

    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + width > vw - MARGIN) {
      left = Math.max(MARGIN, vw - width - MARGIN);
    }
    if (left < MARGIN) {
      left = MARGIN;
    }

    if (placeAbove) {
      const maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove);
      setPositionStyle({
        position: "fixed",
        bottom: `${vh - rect.top + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      });
    } else {
      const maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow);
      setPositionStyle({
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updateCoords();
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
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const defaultClasses =
    size === "sm"
      ? "glass-input h-8 px-2.5 text-xs"
      : "glass-input h-10 px-3 text-xs";

  return (
    <div className="relative inline-block w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={title}
        className={`${defaultClasses} w-full flex items-center justify-between gap-2 text-left cursor-pointer transition-all hover:border-purple-500/40 disabled:opacity-40 disabled:cursor-not-allowed ${
          isOpen ? "border-purple-500 ring-2 ring-purple-500/20" : ""
        } ${className}`}
      >
        <span className="truncate flex items-center gap-1.5 text-slate-900 dark:text-white">
          {selectedOption ? (
            <>
              {selectedOption.flag && <span className="shrink-0">{selectedOption.flag}</span>}
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate font-medium">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({selectedOption.subtitle})
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-purple-500" : ""
          }`}
        />
      </button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[10000]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              style={positionStyle}
              className="glass-dropdown p-1.5 z-[10001] bg-white/60 dark:bg-[#12151f]/65 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl glass-modal-enter overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {opt.flag && <span className="shrink-0">{opt.flag}</span>}
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.subtitle && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({opt.subtitle})
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={13} className="text-purple-500 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
