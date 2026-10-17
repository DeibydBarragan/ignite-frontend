import type { ActiveTab } from "@/features/guild/components/context-toolbar";

export interface TabServiceBadgeProps {
  activeTab: ActiveTab;
  isBotOnline: boolean;
}

/** Indicador del estado del servicio asociado a la pestaña activa. */
export function TabServiceBadge({ activeTab, isBotOnline }: TabServiceBadgeProps) {
  const tabStatus =
    activeTab === "music"
      ? {
          isOnline: isBotOnline,
          label: isBotOnline ? "Música Online" : "Música Offline",
          title: isBotOnline
            ? "El bot de música (Ignite Music) está activo y conectado"
            : "El bot de música (Ignite Music) está detenido",
        }
      : activeTab === "tts"
      ? {
          isOnline: true,
          label: "Voz & TTS Online",
          title: "El servicio de Voz y TTS está activo",
        }
      : {
          isOnline: true,
          label: "Soundboard Online",
          title: "El catálogo de efectos de sonido está conectado",
        };

  return (
    <div
      title={tabStatus.title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
        tabStatus.isOnline
          ? "border-emerald-500/25 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03] text-emerald-600 dark:text-emerald-400"
          : "border-rose-500/30 bg-rose-500/[0.08] text-rose-600 dark:text-rose-400 animate-pulse"
      }`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {tabStatus.isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            tabStatus.isOnline ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {tabStatus.label}
      </span>
    </div>
  );
}
