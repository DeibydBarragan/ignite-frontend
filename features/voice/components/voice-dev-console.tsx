"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { fetchVoiceLogs, clearVoiceLogs } from "../services/voice-service";
import type { VoiceLogEntry } from "../types/voice-types";
import { musicUrl } from "@/lib/ignite-api";
import {
  Terminal,
  Trash2,
  RefreshCw,
  ArrowDownCircle,
  Copy,
  Check,
} from "lucide-react";

interface VoiceDevConsoleProps {
  guildId: string;
}

type FilterMode = "all" | "groq" | "casual";

/** Why the local filter kept an audio away from Groq (gateReason sent by ignite-music). */
const GATE_REASON_LABELS: Record<string, string> = {
  no_wake_word: "Sin wake word",
  no_command_after: "Wake word sin comando",
  no_supported_wake_word: "Wake word no soportada por Vosk",
  gate_unavailable: "Filtro local no disponible",
  rate_limited: "Límite de llamadas por usuario",
};

const COPIED_FLASH_MS = 1500;

function formatTime(timestamp: number | string): string {
  return new Date(timestamp).toLocaleTimeString("es-ES", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function summaryOf(entry: VoiceLogEntry): string {
  if (entry.groqEngaged) {
    return entry.matchedWakeWord ? `wake word "${entry.matchedWakeWord}"` : "filtro local apagado";
  }
  return `${GATE_REASON_LABELS[entry.gateReason ?? ""] ?? "descartada en local"} · 0 tokens`;
}

/** Plain-text version of one log entry, as copied to the clipboard. */
function entryToText(entry: VoiceLogEntry): string {
  const head = [
    `[${formatTime(entry.timestamp)}]`,
    entry.groqEngaged ? "GROQ" : "SKIP",
    summaryOf(entry),
    entry.userId ? `user:${entry.userId.slice(-6)}` : "",
    `${(entry.audioBytes / 1024).toFixed(1)} KB`,
  ]
    .filter(Boolean)
    .join(" ");
  const lines = [head, `  vosk: ${entry.voskHeard ? `"${entry.voskHeard}"` : "(silencio / desconocido)"}`];
  if (entry.groqEngaged) {
    lines.push(`  groq: "${entry.groqText ?? ""}"${entry.groqElapsedMs ? ` ${entry.groqElapsedMs}ms` : ""}`);
    if (entry.commandId) lines.push(`  exec: /${entry.commandId}${entry.query ? ` "${entry.query}"` : ""}`);
    if (entry.ttsMessage) lines.push(`  tts: "${entry.ttsMessage}"`);
  }
  return lines.join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for contexts without the async clipboard API.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function VoiceDevConsole({ guildId }: VoiceDevConsoleProps) {
  const [logs, setLogs] = useState<VoiceLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLive, setIsLive] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  /** Entry id (or "all") that was just copied, to flash a confirmation. */
  const [copied, setCopied] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const copyAndFlash = async (key: string, text: string) => {
    if (!(await copyText(text))) return;
    setCopied(key);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), COPIED_FLASH_MS);
  };

  const handleCopyAll = () => {
    if (logs.length === 0) return;
    void copyAndFlash("all", logs.map(entryToText).join("\n\n"));
  };

  const handleCopyEntry = (entry: VoiceLogEntry) => {
    // Do not hijack a text selection made by dragging over the log.
    if (window.getSelection()?.toString()) return;
    void copyAndFlash(entry.id, entryToText(entry));
  };

  // Load initial logs
  const loadLogs = useCallback(async () => {
    if (!guildId) return;
    try {
      const res = await fetchVoiceLogs(guildId, 60);
      if (res.ok && res.data?.logs) {
        setLogs(res.data.logs);
      }
    } catch {
      // Ignore load error
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    // Initial fetch from an external system (the bot API); setState lands in an async callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs();
  }, [loadLogs]);

  // Connect to SSE stream for live updates
  useEffect(() => {
    if (!guildId || typeof EventSource === "undefined") return;

    let source: EventSource | null = null;
    try {
      source = new EventSource(musicUrl(`guilds/${encodeURIComponent(guildId)}/events`));

      source.addEventListener("open", () => setIsLive(true));
      source.addEventListener("error", () => setIsLive(false));

      const handleVoiceLog = (e: MessageEvent) => {
        try {
          const entry: VoiceLogEntry = JSON.parse(e.data);
          setLogs((prev) => {
            if (prev.some((item) => item.id === entry.id)) {
              return prev;
            }
            return [entry, ...prev.slice(0, 99)];
          });
        } catch {
          // Ignore parse error
        }
      };

      source.addEventListener("voice.log", handleVoiceLog);

      return () => {
        if (source) {
          source.removeEventListener("voice.log", handleVoiceLog);
          source.close();
        }
        setIsLive(false);
      };
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLive(false);
    }
  }, [guildId]);

  // Auto-scroll when logs change
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Clear logs handler
  const handleClear = async () => {
    setLogs([]);
    try {
      await clearVoiceLogs(guildId);
    } catch {
      // Ignore clear failure
    }
  };

  // Metrics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const groq = logs.filter((l) => l.groqEngaged).length;
    const casual = logs.filter((l) => !l.groqEngaged).length;
    // Groq calls that did not end in a command: these are the calls the local filter should have stopped
    const wasted = logs.filter((l) => l.groqEngaged && l.status !== "executed").length;
    const groqPct = total > 0 ? Math.round((groq / total) * 100) : 0;
    return { total, groq, casual, wasted, groqPct };
  }, [logs]);

  // Filtered list
  const filteredLogs = useMemo(() => {
    if (filter === "groq") return logs.filter((l) => l.groqEngaged);
    if (filter === "casual") return logs.filter((l) => !l.groqEngaged);
    return logs;
  }, [logs, filter]);

  const filters: { id: FilterMode; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: logs.length },
    { id: "groq", label: "Groq", count: stats.groq },
    { id: "casual", label: "Descartados", count: stats.casual },
  ];

  const toolBtn =
    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50";

  return (
    <div className="glass-card rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden font-mono text-slate-700 dark:text-slate-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-purple-600 dark:text-purple-400 shrink-0"
            aria-hidden="true"
          >
            <Terminal size={14} />
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">voice.log</span>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] ${
              isLive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isLive ? "en vivo" : "reconectando"}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setAutoScroll((prev) => !prev)}
            aria-pressed={autoScroll}
            className={`${toolBtn} ${autoScroll ? "!text-purple-600 dark:!text-purple-400" : ""}`}
          >
            <ArrowDownCircle size={12} />
            Auto-scroll
          </button>
          <button type="button" onClick={loadLogs} className={toolBtn}>
            <RefreshCw size={12} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={logs.length === 0}
            className={`${toolBtn} ${copied === "all" ? "!text-emerald-600 dark:!text-emerald-400" : ""}`}
          >
            {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
            {copied === "all" ? "Copiado" : "Copiar todo"}
          </button>
          <button type="button" onClick={handleClear} className={`${toolBtn} hover:!text-rose-600 dark:hover:!text-rose-400`}>
            <Trash2 size={12} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Filters + summary */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-1 py-1.5" role="tablist" aria-label="Filtrar registros">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                filter === f.id
                  ? "bg-purple-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {f.label} <span className={filter === f.id ? "text-white/80" : "text-slate-400"}>{f.count}</span>
            </button>
          ))}
        </div>
        <p
          className="text-[11px] text-slate-500 dark:text-slate-400 py-1.5"
          title="Llamadas a Groq que no terminaron en un comando. Idealmente cercano a 0."
        >
          {stats.wasted} sin comando · {stats.groqPct}% a Groq
        </p>
      </div>

      {/* Log list, newest first */}
      <div
        ref={logContainerRef}
        className="overflow-y-auto py-1 text-xs leading-5 bg-black/[0.02] dark:bg-black/20 scrollbar-thin scrollbar-thumb-slate-400/30 scrollbar-track-transparent"
        style={{ maxHeight: 420, minHeight: 200 }}
      >
        {isLoading ? (
          <p className="px-4 py-2 text-slate-500">Cargando registro de voz...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="px-4 py-2 text-slate-500">Sin actividad. Di la wake word seguida de un comando.</p>
        ) : (
          filteredLogs.map((entry) => {
            const time = formatTime(entry.timestamp);
            const isGroq = entry.groqEngaged;
            const executed = entry.status === "executed";
            const accent = !isGroq
              ? "border-l-transparent"
              : executed
                ? "border-l-emerald-500/70"
                : "border-l-amber-500/70";

            const rows: { tag: string; body: React.ReactNode }[] = [
              {
                tag: "vosk",
                body: entry.voskHeard ? (
                  <span className="text-slate-800 dark:text-slate-200">&quot;{entry.voskHeard}&quot;</span>
                ) : (
                  <span className="text-slate-400">(silencio / desconocido)</span>
                ),
              },
            ];
            if (isGroq) {
              rows.push({
                tag: "groq",
                body: (
                  <>
                    <span className="text-slate-900 dark:text-white">&quot;{entry.groqText}&quot;</span>
                    {entry.groqElapsedMs ? <span className="text-slate-400"> {entry.groqElapsedMs}ms</span> : null}
                  </>
                ),
              });
              if (entry.commandId) {
                rows.push({
                  tag: "exec",
                  body: (
                    <>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">/{entry.commandId}</span>
                      {entry.query ? <span> &quot;{entry.query}&quot;</span> : null}
                    </>
                  ),
                });
              }
              if (entry.ttsMessage) {
                rows.push({
                  tag: "tts",
                  body: <span>&quot;{entry.ttsMessage}&quot;</span>,
                });
              }
            }

            return (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                title="Clic para copiar este log"
                onClick={() => handleCopyEntry(entry)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCopyEntry(entry);
                  }
                }}
                className={`px-4 py-1.5 border-l-2 ${accent} hover:bg-black/[0.03] dark:hover:bg-white/[0.04] focus-visible:outline-none focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.06] transition-colors break-words cursor-pointer`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-slate-400 tabular-nums">{time}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      isGroq ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {isGroq ? "groq" : "skip"}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{summaryOf(entry)}</span>
                  <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                    {copied === entry.id ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check size={11} /> copiado
                      </span>
                    ) : (
                      <>
                        {entry.userId ? `user:${entry.userId.slice(-6)} · ` : ""}
                        {(entry.audioBytes / 1024).toFixed(1)} KB
                      </>
                    )}
                  </span>
                </div>
                {rows.map((row, i) => (
                  <div key={row.tag} className="pl-2 text-slate-600 dark:text-slate-400">
                    <span className="text-slate-300 dark:text-slate-600">{i === rows.length - 1 ? "└" : "├"}</span>{" "}
                    <span className="inline-block w-9 text-slate-400">{row.tag}</span>
                    {row.body}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
