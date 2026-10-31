"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useDevMode } from "@/features/auth/hooks/use-dev-mode";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { VoiceViewSkeleton } from "@/components/ui/view-skeletons";
import {
  fetchGuildVoiceSettings,
  updateGuildVoiceSettings,
} from "../services/voice-service";
import type { GuildVoiceSettings, VoiceBinding } from "../types/voice-types";
import { VoiceWakeCard } from "./voice-wake-card";
import { VoiceSpeechCard } from "./voice-speech-card";
import { VoiceBindingsCard } from "./voice-bindings-card";
import { VoiceDevConsole } from "./voice-dev-console";
import { Save, AlertCircle, Bot, Mic, Headphones, LogOut, Terminal, ListMusic } from "lucide-react";

const VALID_TABS = ["general", "comandos", "consola"] as const;
type VoiceTab = (typeof VALID_TABS)[number];

export function VoiceView() {
  const {
    selectedGuildId,
    selectedGuild,
    isBotOnline,
    botVoiceChannel,
    isBotInVoice,
    isJoiningVoice,
    joinVoice,
    leaveVoice,
  } = useAuth();
  const { isDevMode } = useDevMode();
  const { toast } = useToast();

  const [activeTab, setActiveTabState] = useState<VoiceTab>("general");
  const setActiveTab = (tab: string) => {
    if (VALID_TABS.includes(tab as VoiceTab)) setActiveTabState(tab as VoiceTab);
  };

  const [settings, setSettings] = useState<GuildVoiceSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<GuildVoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedGuildId) return;

    let isMounted = true;
    void (async () => {
      try {
        const res = await fetchGuildVoiceSettings(selectedGuildId);
        if (!isMounted) return;
        if (res.ok) {
          setSettings(res.data);
          setSavedSettings(res.data);
        } else {
          toast(res.error || "No se pudieron cargar los ajustes de voz", "error");
        }
      } catch {
        if (isMounted) {
          toast("Error de conexión al cargar la configuración de voz", "error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedGuildId, toast]);

  // Check dirty state
  const isDirty = useMemo(() => {
    if (!settings || !savedSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  // Save handler
  const handleSave = async () => {
    if (!selectedGuildId || !settings || isSaving) return;
    setIsSaving(true);
    try {
      const res = await updateGuildVoiceSettings(selectedGuildId, settings);
      if (res.ok) {
        setSettings(res.data);
        setSavedSettings(res.data);
        toast("Ajustes de comandos de voz guardados con éxito", "success");
      } else {
        toast(res.error || "Error al guardar ajustes de voz", "error");
      }
    } catch {
      toast("Error de conexión al guardar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset handler
  if (!selectedGuildId) {
    return (
      <div className="glass-card p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-12 border border-black/5 dark:border-white/10">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
          <Bot size={28} />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Selecciona un servidor
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Para personalizar los comandos de voz y la palabra de activación, selecciona un servidor en la barra superior.
        </p>
      </div>
    );
  }

  if (isLoading || !settings) {
    return <VoiceViewSkeleton />;
  }

  // "consola" only exists in dev mode; fall back to general if dev mode is off
  const effectiveTab: VoiceTab = activeTab === "consola" && !isDevMode ? "general" : activeTab;

  const tabs: TabItem[] = [
    { id: "general", label: "General", icon: <Mic size={14} /> },
    { id: "comandos", label: "Comandos", icon: <ListMusic size={14} /> },
    ...(isDevMode ? [{ id: "consola", label: "Consola", icon: <Terminal size={14} /> }] : []),
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Compact sticky action bar: status + join/leave + save/reset */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 sticky top-2 z-10 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Mic size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Comandos de Voz &bull; {selectedGuild?.name || "Servidor"}
            </h2>
            <p className="text-[11px] flex items-center gap-2 flex-wrap">
              {!isBotOnline ? (
                <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Bot desconectado
                </span>
              ) : isBotInVoice ? (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Escuchando en #{botVoiceChannel?.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Bot fuera del chat de voz
                </span>
              )}
              <span className="text-slate-300 dark:text-slate-600">|</span>
              {isDirty ? (
                <span className="text-amber-500 font-medium">Cambios sin guardar</span>
              ) : (
                <span className="text-emerald-500 font-medium">Sincronizado</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap justify-end">
          {/* Master module toggle (moved out of the General tab) */}
          <label className="flex items-center gap-2 cursor-pointer select-none mr-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {settings.enabled ? "Módulo activado" : "Módulo pausado"}
            </span>
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <span className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </span>
          </label>
          <span className="h-5 w-px bg-black/10 dark:bg-white/10" />
          {isBotInVoice ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const ok = await leaveVoice();
                if (ok) toast("Bot desconectado del canal de voz.", "info");
              }}
              isLoading={isJoiningVoice}
              className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20"
            >
              <LogOut size={13} />
              <span>Desconectar</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const ok = await joinVoice();
                if (ok) toast("¡Bot conectado al canal de voz!", "success");
                else toast("No se pudo unir al canal de voz. Entra primero a un canal en Discord.", "error");
              }}
              isLoading={isJoiningVoice}
              isDisabled={!isBotOnline}
              className="text-xs border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            >
              <Headphones size={13} />
              <span>Unir al Chat de Voz</span>
            </Button>
          )}
          <span className="h-5 w-px bg-black/10 dark:bg-white/10" />
          <Button
            variant="solid"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={!isDirty || isSaving}
            className="px-4"
          >
            <Save size={14} />
            <span>Guardar</span>
          </Button>
        </div>
      </div>

      {/* Bot offline banner (only when the user cannot act, to avoid pushing everything down) */}
      {!isBotOnline && (
        <div className="p-3 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[11px]">
            <span className="font-semibold">Ignite Music está desconectado.</span>
            <span className="opacity-90 ml-1">
              Los cambios se guardan, pero el reconocimiento de voz no responderá hasta que el bot vuelva en línea.
            </span>
          </p>
        </div>
      )}

      <Tabs tabs={tabs} activeId={effectiveTab} onChange={setActiveTab} label="Secciones de comandos de voz" />

      {/* General: wake words + recognition language + confirmation voice/switch */}
      {effectiveTab === "general" && (
        <div role="tabpanel" id="general-panel" aria-labelledby="general-tab" className="space-y-5">
          <VoiceWakeCard
            wakeWord={settings.wake_word}
            onWakeWordChange={(wake_word) => setSettings({ ...settings, wake_word })}
          />
          <VoiceSpeechCard
            language={settings.language}
            onLanguageChange={(language) => setSettings({ ...settings, language })}
            ttsVoice={settings.tts_voice || "es-MX-DaliaNeural"}
            onTtsVoiceChange={(tts_voice) => setSettings({ ...settings, tts_voice })}
            ttsPitch={settings.tts_pitch ?? 1.0}
            onTtsPitchChange={(tts_pitch) => setSettings({ ...settings, tts_pitch })}
            ttsRate={settings.tts_rate ?? 1.0}
            onTtsRateChange={(tts_rate) => setSettings({ ...settings, tts_rate })}
            ttsEnabled={settings.tts_feedback_enabled}
            onTtsEnabledChange={(tts_feedback_enabled) =>
              setSettings({ ...settings, tts_feedback_enabled })
            }
          />
        </div>
      )}

      {/* Comandos: command/phrase bindings + per-command reply template */}
      {effectiveTab === "comandos" && (
        <div role="tabpanel" id="comandos-panel" aria-labelledby="comandos-tab" className="space-y-5">
          <VoiceBindingsCard
            bindings={settings.bindings}
            onBindingsChange={(bindings: VoiceBinding[]) => setSettings({ ...settings, bindings })}
            wakeWord={settings.wake_word}
            templates={settings.tts_templates || {}}
            onTemplatesChange={(tts_templates) => setSettings({ ...settings, tts_templates })}
            ttsEnabled={settings.tts_feedback_enabled}
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isDirty}
          />
        </div>
      )}

      {/* Consola: developer-only live voice console */}
      {effectiveTab === "consola" && isDevMode && (
        <div role="tabpanel" id="consola-panel" aria-labelledby="consola-tab">
          <VoiceDevConsole guildId={selectedGuildId} />
        </div>
      )}
    </div>
  );
}
