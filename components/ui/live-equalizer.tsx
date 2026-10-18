"use client";

export interface LiveEqualizerProps {
  isPlaying?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "spotify" | "purple" | "gradient" | "monochrome";
  className?: string;
  title?: string;
}

export function LiveEqualizer({
  isPlaying = true,
  size = "sm",
  variant = "spotify",
  className = "",
  title,
}: LiveEqualizerProps) {
  const config = {
    xs: { height: "h-2.5", barWidth: "w-[2px]", gap: "gap-[1.5px]", barCount: 3 },
    sm: { height: "h-3.5", barWidth: "w-[2.5px]", gap: "gap-[2px]", barCount: 4 },
    md: { height: "h-5", barWidth: "w-[3px]", gap: "gap-[2.5px]", barCount: 4 },
    lg: { height: "h-7", barWidth: "w-[4px]", gap: "gap-[3px]", barCount: 5 },
  }[size];

  const getBarColor = (index: number) => {
    if (!isPlaying) return "bg-slate-400/50 dark:bg-slate-600/70";
    if (variant === "purple") {
      return "bg-purple-500 dark:bg-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]";
    }
    if (variant === "gradient") {
      return index % 2 === 0
        ? "bg-[#1ed760] drop-shadow-[0_0_6px_rgba(30,215,96,0.6)]"
        : "bg-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]";
    }
    if (variant === "monochrome") {
      return "bg-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]";
    }
    return "bg-[#1ed760] drop-shadow-[0_0_6px_rgba(30,215,96,0.6)]";
  };

  const animClasses = ["ignite-eq-1", "ignite-eq-2", "ignite-eq-3", "ignite-eq-4", "cover-eq-5"];

  return (
    <div
      className={`inline-flex items-end ${config.gap} ${config.height} justify-center shrink-0 select-none ${className}`}
      title={title || (isPlaying ? "Sonando ahora en Discord" : "En pausa")}
      aria-label={isPlaying ? "Audio en reproducción" : "Audio pausado"}
    >
      {Array.from({ length: config.barCount }).map((_, i) => (
        <span
          key={i}
          className={`${config.barWidth} h-full rounded-full ${getBarColor(i)} ${
            isPlaying ? animClasses[i % animClasses.length] : "scale-y-[0.25] opacity-40"
          } transition-transform duration-200`}
        />
      ))}
    </div>
  );
}
