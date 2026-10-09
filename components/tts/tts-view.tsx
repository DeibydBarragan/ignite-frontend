"use client";

import { useState, useEffect } from "react";
import { useBot } from "@/context/bot-context";
import { soundApi, VoiceItem, FALLBACK_VOICES } from "@/lib/sound-api";
import {
  fetchSavedPhrases,
  deleteSavedPhrase,
  SavedPhrase,
} from "@/lib/phrases-service";
import { AddPhraseModal } from "./add-phrase-modal";
import {
  Mic,
  Send,
  Volume2,
  Bookmark,
  Plus,
  Play,
  Trash2,
  ArrowUpLeft,
  CheckCircle2,
  AlertCircle,
  Radio,
  Loader2,
} from "lucide-react";

export function TTSView() {
  const { isVoiceConnected, currentVoiceChannel, selectedGuild, user } = useBot();

  // Composer State
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<VoiceItem[]>(FALLBACK_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState("loquendo");
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Saved Phrases State (Supabase)
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playingPhraseId, setPlayingPhraseId] = useState<string | null>(null);
  const [emittingPhraseId, setEmittingPhraseId] = useState<string | null>(null);

  const maxChars = 300;
  const charsLeft = maxChars - text.length;

  // Load Voices from Bot API
  useEffect(() => {
    soundApi.getVoices().then((res) => {
      if (res && res.length > 0) {
        setVoices(res);
      }
    });
  }, []);

  // Load Saved Phrases from Supabase
  useEffect(() => {
    setIsLoadingPhrases(true);
    fetchSavedPhrases(user?.id)
      .then((data) => setSavedPhrases(data))
      .finally(() => setIsLoadingPhrases(false));
  }, [user?.id]);

  // Handle Main Composer Send to Discord
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    setFeedbackMsg(null);

    const res = await soundApi.speakTTS({
      guildId: selectedGuild?.id,
      channelId: currentVoiceChannel?.id,
      text: text.trim(),
      voice: selectedVoiceId,
      pitch,
      rate,
    });

    if (res.success) {
      setFeedbackMsg({ type: "success", text: "Mensaje emitido en el canal de voz." });
      setText("");
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al emitir en Discord." });
    }

    setIsSending(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handle Browser Audio Preview
  const handlePreview = async () => {
    if (!text.trim() || isPreviewing) return;
    setIsPreviewing(true);
    try {
      await soundApi.previewTTS({
        text: text.trim(),
        voice: selectedVoiceId,
        pitch,
        rate,
      });
    } catch {
      setFeedbackMsg({ type: "error", text: "No se pudo generar la vista previa." });
    } finally {
      setIsPreviewing(false);
    }
  };

  // Preview a saved phrase in browser
  const handlePreviewPhrase = async (phrase: SavedPhrase) => {
    setPlayingPhraseId(phrase.id);
    try {
      await soundApi.previewTTS({
        text: phrase.text,
        voice: phrase.voice,
        pitch: phrase.pitch,
        rate: phrase.rate,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setPlayingPhraseId(null);
    }
  };

  // Speak a saved phrase directly to Discord
  const handleSpeakPhrase = async (phrase: SavedPhrase) => {
    setEmittingPhraseId(phrase.id);
    const res = await soundApi.speakTTS({
      guildId: selectedGuild?.id,
      channelId: currentVoiceChannel?.id,
      text: phrase.text,
      voice: phrase.voice,
      pitch: phrase.pitch,
      rate: phrase.rate,
    });
    setEmittingPhraseId(null);

    if (res.success) {
      setFeedbackMsg({ type: "success", text: `"${phrase.title}" emitida en Discord.` });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al emitir." });
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Load saved phrase into the composer
  const handleLoadToComposer = (phrase: SavedPhrase) => {
    setText(phrase.text);
    if (phrase.voice) setSelectedVoiceId(phrase.voice);
    if (phrase.pitch) setPitch(phrase.pitch);
    if (phrase.rate) setRate(phrase.rate);
  };

  // Delete saved phrase
  const handleDeletePhrase = async (id: string) => {
    await deleteSavedPhrase(id);
    setSavedPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-28">
      {/* ─── Main TTS Composer (Left 2 columns) ────────────────── */}
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
                  Voces neuronales de Microsoft y Loquendo conectadas en vivo con tu bot.
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
                {isVoiceConnected && currentVoiceChannel ? currentVoiceChannel.name : "Canal de Voz"}
              </span>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative mb-3">
            <textarea
              rows={4}
              maxLength={maxChars}
              placeholder="Escribe el mensaje que dirá el bot en Discord..."
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

          {/* Quick Voice Selector & Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 mb-4">
            {/* Voice Dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Voz seleccionada
              </label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="glass-input w-full py-1.5 px-2.5 text-xs text-slate-900 dark:text-white"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id} className="dark:bg-slate-900">
                    {v.flag} {v.name} ({v.gender})
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
                min="0.6"
                max="1.6"
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
                max="1.6"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Feedback message banner */}
          {feedbackMsg && (
            <div
              className={`mb-3 p-2.5 rounded-lg flex items-center gap-2 text-xs border ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {feedbackMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!text.trim() || isPreviewing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              {isPreviewing ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
              <span>Probar en navegador</span>
            </button>

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
                  <Loader2 size={14} className="animate-spin" />
                  <span>Emitiendo...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Emitir en Discord</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Frases Guardadas (Right column - Supabase) ────────── */}
      <div className="space-y-3">
        <div className="glass-panel p-4 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between mb-3 border-b border-black/5 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <Bookmark size={15} className="text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                Frases Guardadas
              </h4>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="glass-pill px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 border border-purple-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus size={12} />
              <span>Nueva frase</span>
            </button>
          </div>

          {isLoadingPhrases ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin text-purple-500" />
              <span className="text-xs">Cargando frases de Supabase...</span>
            </div>
          ) : savedPhrases.length === 0 ? (
            <div className="text-center py-8 px-2">
              <Bookmark size={28} className="mx-auto text-slate-400/50 mb-2" />
              <p className="text-xs text-slate-400">No tienes frases guardadas aún.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Crea una frase para reproducirla con un solo clic.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              {savedPhrases.map((phrase) => {
                const voiceInfo = voices.find((v) => v.id === phrase.voice);
                const isPlaying = playingPhraseId === phrase.id;
                const isEmitting = emittingPhraseId === phrase.id;

                return (
                  <div
                    key={phrase.id}
                    className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col gap-2 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {phrase.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                          &ldquo;{phrase.text}&rdquo;
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeletePhrase(phrase.id)}
                        title="Eliminar frase"
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 text-[10px]">
                      {/* Voice Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                        {voiceInfo ? `${voiceInfo.flag} ${voiceInfo.name}` : phrase.voice}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Copy/Load to composer */}
                        <button
                          onClick={() => handleLoadToComposer(phrase)}
                          title="Cargar al editor"
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowUpLeft size={13} />
                        </button>

                        {/* Preview Audio */}
                        <button
                          onClick={() => handlePreviewPhrase(phrase)}
                          disabled={isPlaying}
                          title="Probar en navegador"
                          className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                        >
                          {isPlaying ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Play size={10} />
                          )}
                          <span>Probar</span>
                        </button>

                        {/* Speak in Discord */}
                        <button
                          onClick={() => handleSpeakPhrase(phrase)}
                          disabled={isEmitting}
                          title="Emitir en Discord"
                          className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 shadow-xs"
                        >
                          {isEmitting ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Radio size={10} />
                          )}
                          <span>Emitir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Nueva Frase */}
      <AddPhraseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        voices={voices}
        userId={user?.id}
        onPhraseAdded={(newPhrase) => {
          setSavedPhrases((prev) => [newPhrase, ...prev]);
        }}
      />
    </div>
  );
}
