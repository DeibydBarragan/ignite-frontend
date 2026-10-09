"use client";

import { useState } from "react";
import { useBot } from "@/context/bot-context";
import {
  Mic,
  Send,
  Volume2,
  Sliders,
  History,
  RotateCcw,
  AlertCircle,
  Radio,
} from "lucide-react";

const VOICES = [
  { id: "es-jorge", name: "Jorge (Español Neutro)", lang: "es-ES" },
  { id: "es-lucia", name: "Lucía (Español Femenino)", lang: "es-MX" },
  { id: "en-brian", name: "Brian (English Classic)", lang: "en-US" },
  { id: "cyber-bot", name: "Cyber Bot (Sintetizador)", lang: "es-ES" },
  { id: "anime-voice", name: "Anime Style (Agudo)", lang: "ja-JP" },
];

const PRESET_MESSAGES = [
  "¡Listos todos, comienza la partida!",
  "Buenas noches a todos, desconectando.",
  "AFK por 5 minutos, ya vuelvo.",
  "GG bien jugado equipo.",
];

export function TTSView() {
  const { isVoiceConnected, currentVoiceChannel, sendTTS, recentTTS } = useBot();

  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].name);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isSending, setIsSending] = useState(false);

  const maxChars = 250;
  const charsLeft = maxChars - text.length;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    sendTTS(text, selectedVoice, pitch, rate);

    setTimeout(() => {
      setIsSending(false);
      setText("");
    }, 1200);
  };

  const handleResend = (msg: { text: string; voice: string; pitch: number; rate: number }) => {
    sendTTS(msg.text, msg.voice, msg.pitch, msg.rate);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-28">
      {/* Main TTS Composer (Left 2 columns) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-panel p-5 sm:p-6 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Mic size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Sintetizador de Voz (TTS)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  El bot leerá el mensaje de forma instantánea en la sala de audio.
                </p>
              </div>
            </div>

            {/* Target Channel Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-black/5 dark:border-white/10 text-[11px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isVoiceConnected ? "bg-[#1db954]" : "bg-amber-500"
                }`}
              />
              <span className="truncate max-w-[130px]">
                {isVoiceConnected && currentVoiceChannel ? currentVoiceChannel.name : "Desconectado"}
              </span>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative mb-3">
            <textarea
              rows={4}
              maxLength={maxChars}
              placeholder="Escribe el mensaje a emitir en Discord..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="glass-input w-full p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
            <span
              className={`absolute bottom-2.5 right-3 text-[10px] font-mono tabular-nums ${
                charsLeft < 30 ? "text-amber-500" : "text-slate-400"
              }`}
            >
              {charsLeft} caracteres restantes
            </span>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <div className="text-[11px] text-slate-400 mb-1.5">Frases sugeridas:</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(preset)}
                  className="glass-pill px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Modulations & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 mb-4">
            {/* Voice Select */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Voz del sintetizador
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="glass-input w-full py-1.5 px-2.5 text-xs text-slate-900 dark:text-white"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.name} className="dark:bg-slate-900">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pitch Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Tono
                </label>
                <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
                  {pitch.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Rate / Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Velocidad
                </label>
                <span className="text-[11px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
                  {rate.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {!isVoiceConnected ? (
              <p className="text-[11px] text-amber-500 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>Requiere estar conectado a un canal de voz para emitir.</span>
              </p>
            ) : (
              <span className="text-[11px] text-slate-400">
                Se reproducirá por el bot y en tu navegador para prueba local.
              </span>
            )}

            <button
              onClick={() => handleSend()}
              disabled={!text.trim() || isSending}
              className={`px-4 py-2 rounded-xl font-medium text-xs shadow-xs flex items-center gap-1.5 transition-all shrink-0 ${
                isSending
                  ? "bg-[#1db954] text-black"
                  : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <>
                  <Volume2 size={14} className="animate-spin" />
                  <span>Emitiendo...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Emitir en voz</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent TTS History (Right column) */}
      <div className="space-y-3">
        <div className="glass-panel p-4 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between mb-3 border-b border-black/5 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <History size={14} className="text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                Historial de Emisiones
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums font-mono">
              {recentTTS.length} enviados
            </span>
          </div>

          {recentTTS.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              Aún no has transmitido frases TTS.
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {recentTTS.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col justify-between gap-2"
                >
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    &ldquo;{msg.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-black/5 dark:border-white/5 pt-1.5 tabular-nums">
                    <span>{msg.voice} &bull; {msg.timestamp}</span>
                    <button
                      onClick={() => handleResend(msg)}
                      title="Volver a emitir"
                      className="glass-btn px-2 py-0.5 text-purple-600 dark:text-purple-400 hover:text-purple-500 flex items-center gap-1 text-[10px]"
                    >
                      <RotateCcw size={10} />
                      <span>Reenviar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
