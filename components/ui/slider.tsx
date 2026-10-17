"use client";

import { type ChangeEvent } from "react";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  className = "",
  ariaLabel = "Control deslizante",
}: SliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`relative flex items-center w-full touch-none select-none ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className="w-full h-1.5 bg-slate-300 dark:bg-white/10 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 accent-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        style={{
          background: `linear-gradient(to right, #7c3aed ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
        }}
      />
    </div>
  );
}
