"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { customerApi } from "@/lib/api/customer-api";

interface ConsoleLine {
  id: string;
  timestamp: string;
  text: string;
  channel: "SERVER" | "PHANTOM" | "ADMIN" | "RCON" | "ERROR" | "STATUS";
}

const MAX_LINES = 1000;

export function ServerConsole({
  serverId,
  runtimeState
}: {
  serverId: string;
  runtimeState: string;
}) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [connection, setConnection] = useState<"idle" | "connecting" | "open" | "closed" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const append = useCallback((entries: ConsoleLine[]) => {
    if (entries.length === 0) return;
    setLines((current) => {
      const next = current.concat(entries);
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  }, []);

  const connect = useCallback(async () => {
    setConnection("connecting");
    setError(null);
    try {
      const ticket = await customerApi.issueConsoleTicket(serverId);
      const ws = new WebSocket(ticket.url);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnection("open");
        append([
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            text: "Console attached.",
            channel: "PHANTOM"
          }
        ]);
      };

      ws.onmessage = (event) => {
        const incoming = parseEvents(typeof event.data === "string" ? event.data : "");
        if (incoming.length > 0) append(incoming);
      };

      ws.onerror = () => {
        setConnection("error");
        setError("WebSocket error.");
      };

      ws.onclose = () => {
        setConnection("closed");
        socketRef.current = null;
        if (shouldReconnectRef.current) {
          // Auto-reconnect after a short delay (e.g. ticket expired or
          // network blip). Customer can also manually retry.
          reconnectTimerRef.current = window.setTimeout(() => {
            void connect();
          }, 2_000);
        }
      };
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Failed to open console.");
      setConnection("error");
    }
  }, [append, serverId]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    void connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim() || socketRef.current?.readyState !== WebSocket.OPEN) return;
    const id = crypto.randomUUID();
    const text = command.trim();
    socketRef.current.send(
      JSON.stringify({ type: "command", command: text, id })
    );
    append([
      {
        id,
        timestamp: new Date().toISOString(),
        text: `> ${text}`,
        channel: "ADMIN"
      }
    ]);
    setCommand("");
  };

  const consoleReady = runtimeState === "running";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connection === "open"
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                : connection === "connecting"
                ? "bg-amber-300 animate-pulse"
                : "bg-red-400"
            }`}
          />
          {connection === "open"
            ? "Connected"
            : connection === "connecting"
            ? "Connecting…"
            : connection === "closed"
            ? "Disconnected — reconnecting"
            : "Error"}
        </span>
        {!consoleReady ? (
          <span className="text-amber-300">Server is {runtimeState}. Logs may be sparse.</span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#070707] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div
          ref={scrollRef}
          className="h-[480px] overflow-y-auto p-4 font-mono text-[12px] leading-6 text-slate-100"
        >
          {lines.length === 0 ? (
            <p className="text-slate-600">Waiting for output…</p>
          ) : (
            lines.map((line) => (
              <p key={line.id} className="whitespace-pre-wrap">
                <span className="text-slate-600">[{formatClock(line.timestamp)} </span>
                <span className={channelTone(line.channel)}>{line.channel}</span>
                <span className="text-slate-600">] </span>
                <span className={lineTone(line.channel)}>{line.text}</span>
              </p>
            ))
          )}
        </div>
        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-white/10 bg-[#0a0a12] px-3 py-2"
        >
          <span className="font-mono text-xs text-accent">&gt;</span>
          <input
            type="text"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            disabled={!consoleReady || connection !== "open"}
            placeholder={
              consoleReady ? 'Type a command (e.g. "say hello")' : "Server must be running to send commands"
            }
            className="h-9 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!consoleReady || connection !== "open" || !command.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/[0.14] px-3 text-xs font-semibold text-white transition hover:bg-accent/[0.22] disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}

function parseEvents(raw: string): ConsoleLine[] {
  if (!raw) return [];
  // Phantom sends one JSON object per WebSocket frame. Some versions
  // batch multiple events into a JSON array.
  const messages: unknown[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) messages.push(...parsed);
    else messages.push(parsed);
  } catch {
    return [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        text: raw,
        channel: "SERVER"
      }
    ];
  }

  const out: ConsoleLine[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const event = message as Record<string, unknown>;
    const timestamp =
      typeof event.timestamp === "string" ? event.timestamp : new Date().toISOString();
    const id = crypto.randomUUID();

    if (event.type === "history" && Array.isArray(event.events)) {
      for (const item of event.events) {
        const replayed = parseEvents(JSON.stringify(item));
        out.push(...replayed);
      }
      continue;
    }
    if (event.type === "log") {
      out.push({
        id,
        timestamp,
        text: typeof event.line === "string" ? event.line : String(event.line ?? ""),
        channel: classifyLog(event)
      });
      continue;
    }
    if (event.type === "logs" && Array.isArray(event.lines)) {
      for (const line of event.lines as unknown[]) {
        if (typeof line === "string" && line.length > 0) {
          out.push({
            id: crypto.randomUUID(),
            timestamp,
            text: line,
            channel: classifyRawLine(line)
          });
        }
      }
      continue;
    }
    if (event.type === "status") {
      out.push({
        id,
        timestamp,
        text: `Server status: ${event.status ?? "unknown"}`,
        channel: "STATUS"
      });
      continue;
    }
    if (event.type === "command_result") {
      const output = typeof event.output === "string" ? event.output : "";
      if (output.length > 0) {
        out.push({ id, timestamp, text: output, channel: "RCON" });
      }
      continue;
    }
    if (event.type === "error") {
      out.push({
        id,
        timestamp,
        text: typeof event.message === "string" ? event.message : "Unknown error",
        channel: "ERROR"
      });
    }
  }
  return out;
}

function classifyLog(event: Record<string, unknown>): ConsoleLine["channel"] {
  const line = typeof event.line === "string" ? event.line : "";
  return classifyRawLine(line);
}

function classifyRawLine(line: string): ConsoleLine["channel"] {
  if (line.startsWith("__PHANTOM__")) return "PHANTOM";
  if (/\bERROR\b/.test(line)) return "ERROR";
  return "SERVER";
}

function channelTone(channel: ConsoleLine["channel"]) {
  switch (channel) {
    case "PHANTOM":
      return "text-accent";
    case "ADMIN":
      return "text-emerald-300";
    case "RCON":
      return "text-cyan-300";
    case "ERROR":
      return "text-red-300";
    case "STATUS":
      return "text-amber-300";
    default:
      return "text-slate-400";
  }
}

function lineTone(channel: ConsoleLine["channel"]) {
  switch (channel) {
    case "ERROR":
      return "text-red-200";
    case "ADMIN":
      return "text-emerald-200";
    default:
      return "text-slate-100";
  }
}

function formatClock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toTimeString().slice(0, 8);
}
