"use client";

import { Volume2, MessageSquareQuote, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VOICE_COMMANDS, type VoiceCommandId } from "../types/voice-types";

export interface VoiceTTSCardProps {
  ttsEnabled: boolean;
  onTTSEnabledChange: (enabled: boolean) => void;
  templates: Record<string, string>;
  onTemplatesChange: (templates: Record<string, string>) => void;
}

export function VoiceTTSCard({
  ttsEnabled,
  onTTSEnabledChange,
  templates,
  onTemplatesChange,
}: VoiceTTSCardProps) {
  const handleTemplateChange = (commandId: string, value: string) => {
    onTemplatesChange({
      ...templates,
      [commandId]: value,
    });
  };

  const handleResetTemplate = (commandId: VoiceCommandId) => {
    const cmd = VOICE_COMMANDS.find((c) => c.id === commandId);
    if (!cmd) return;
    onTemplatesChange({
      ...templates,
      [commandId]: cmd.defaultTemplate,
    });
  };

  return (
    <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 space-y-5">
      {/* Header with Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Volume2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Confirmación Auditiva por Voz (TTS)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El bot te responderá hablando en el canal con el mensaje configurado al ejecutar cada orden.
            </p>
          </div>
        </div>

        {/* TTS Toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none self-start sm:self-center">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {ttsEnabled ? "Confirmación Activa" : "Silencioso"}
          </span>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => onTTSEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </div>
        </label>
      </div>

      {/* Helper Note */}
      <div className="p-3 rounded-xl bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border border-blue-500/15 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <span>
            Puedes usar la variable <code className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px]">&#123;query&#125;</code> en comandos que admiten parámetros (ej. reproducir o volumen) para incluir lo que dijiste en la confirmación.
          </span>
        </div>
      </div>

      {/* Templates List */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 transition-opacity ${
          ttsEnabled ? "opacity-100" : "opacity-50 pointer-events-none"
        }`}
      >
        {VOICE_COMMANDS.map((cmd) => {
          const currentValue = templates[cmd.id] ?? cmd.defaultTemplate;
          const isCustom = currentValue !== cmd.defaultTemplate;

          return (
            <div
              key={cmd.id}
              className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquareQuote size={13} className="text-purple-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {cmd.label}
                  </span>
                </div>
                {isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleResetTemplate(cmd.id)}
                    title="Restaurar frase predeterminada"
                    className="h-6 w-6 text-slate-400 hover:text-purple-500"
                  >
                    <RotateCcw size={11} />
                  </Button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleTemplateChange(cmd.id, e.target.value)}
                  placeholder={cmd.defaultTemplate}
                  className="glass-input w-full px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {cmd.requiresParam
                  ? `Incluye {query} para el parámetro. Por defecto: "${cmd.defaultTemplate}"`
                  : `Por defecto: "${cmd.defaultTemplate}"`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
