"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabLoadingSkeleton } from "@/components/ui/tab-loading-skeleton";
import {
  fetchGuildVoiceSettings,
  updateGuildVoiceSettings,
  resetGuildVoiceSettings,
} from "../services/voice-service";
import type { GuildVoiceSettings, VoiceBinding } from "../types/voice-types";
import { VoiceWakeCard } from "./voice-wake-card";
import { VoiceBindingsCard } from "./voice-bindings-card";
import { VoiceTTSCard } from "./voice-tts-card";
import { Save, RotateCcw, AlertCircle, Bot, Mic } from "lucide-react";

export function VoiceView() {
  const { selectedGuildId, selectedGuild, isBotOnline } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<GuildVoiceSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<GuildVoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

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
  const handleReset = async () => {
    if (!selectedGuildId) return;
    try {
      const res = await resetGuildVoiceSettings(selectedGuildId);
      if (res.ok) {
        setSettings(res.data);
        setSavedSettings(res.data);
        setIsResetConfirmOpen(false);
        toast("Configuración de voz restaurada a los valores predeterminados", "success");
      } else {
        toast(res.error || "Error al restaurar configuración", "error");
      }
    } catch {
      toast("Error de conexión al restaurar", "error");
    }
  };

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
    return <TabLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Bot offline banner */}
      {!isBotOnline && (
        <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle size={18} className="shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Ignite Music está desconectado.</span>
            <span className="opacity-90 ml-1">
              Las modificaciones se guardarán, pero el reconocimiento de voz en Discord no responderá hasta que el bot esté en línea.
            </span>
          </div>
        </div>
      )}

      {/* Floating / Sticky Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 sticky top-2 z-10 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Mic size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Comandos de Voz &bull; {selectedGuild?.name || "Servidor"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isDirty ? (
                <span className="text-amber-500 font-medium">Hay cambios sin guardar</span>
              ) : (
                <span className="text-emerald-500 font-medium">Configuración sincronizada</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-slate-500 hover:text-rose-500"
          >
            <RotateCcw size={13} />
            <span>Restaurar Predeterminados</span>
          </Button>

          <Button
            variant="solid"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={!isDirty || isSaving}
            className="px-4"
          >
            <Save size={14} />
            <span>Guardar Cambios</span>
          </Button>
        </div>
      </div>

      {/* Wake Word & Main Switch */}
      <VoiceWakeCard
        wakeWord={settings.wake_word}
        onWakeWordChange={(wake_word) => setSettings({ ...settings, wake_word })}
        language={settings.language}
        onLanguageChange={(language) => setSettings({ ...settings, language })}
        enabled={settings.enabled}
        onEnabledChange={(enabled) => setSettings({ ...settings, enabled })}
      />

      {/* Command & Phrase Bindings */}
      <VoiceBindingsCard
        bindings={settings.bindings}
        onBindingsChange={(bindings: VoiceBinding[]) => setSettings({ ...settings, bindings })}
        wakeWord={settings.wake_word}
      />

      {/* TTS Audio Confirmation */}
      <VoiceTTSCard
        ttsEnabled={settings.tts_feedback_enabled}
        onTTSEnabledChange={(tts_feedback_enabled) =>
          setSettings({ ...settings, tts_feedback_enabled })
        }
        templates={settings.tts_templates || {}}
        onTemplatesChange={(tts_templates) => setSettings({ ...settings, tts_templates })}
      />

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="¿Restaurar comandos de voz?"
        subtitle="Se restablecerá la palabra de activación por defecto, todas las frases predeterminadas y las plantillas de confirmación sonora de este servidor."
        confirmText="Restaurar por defecto"
        confirmVariant="danger"
        confirmIcon={<RotateCcw size={14} />}
      />
    </div>
  );
}
