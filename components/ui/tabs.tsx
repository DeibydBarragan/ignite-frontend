"use client";

import { useRef, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Small dot shown next to the label (e.g. unsaved changes in this tab). */
  dot?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist. */
  label: string;
}

/**
 * Accessible tab strip (WAI-ARIA tabs pattern): roving focus with Left/Right/Home/End,
 * aria-selected on the active tab. Panels are rendered by the parent; each panel must
 * set role="tabpanel", id={`${tabId}-panel`} and aria-labelledby={`${tabId}-tab`}.
 */
export function Tabs({ tabs, activeId, onChange, label }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusTab = (id: string) => {
    onChange(id);
    requestAnimationFrame(() => refs.current[id]?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    focusTab(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex items-center gap-1 overflow-x-auto rounded-2xl glass-card border border-black/5 dark:border-white/10 p-1.5 scrollbar-thin"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            role="tab"
            type="button"
            id={`${tab.id}-tab`}
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.dot && (
              <span
                className={`ml-0.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-amber-500"}`}
                aria-label="cambios sin guardar"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
