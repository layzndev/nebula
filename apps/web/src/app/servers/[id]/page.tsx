"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Terminal,
  Trash2,
  Users
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { ServerConsole } from "@/components/server/ServerConsole";
import { ServerSettingsForm } from "@/components/server/ServerSettingsForm";
import { customerApi, type ServerDetail } from "@/lib/api/customer-api";

const REFRESH_MS = 5_000;
type Tab = "overview" | "console" | "settings";

export default function ServerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [detail, setDetail] = useState<ServerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const result = await customerApi.getServer(id);
      setDetail(result.server);
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const runAction = async (
    action: "start" | "stop" | "restart" | "delete"
  ) => {
    if (!detail) return;
    if (action === "delete" && !window.confirm(`Delete ${detail.server.name}? This cannot be undone.`)) return;
    setBusy(action);
    try {
      if (action === "start") await customerApi.startServer(detail.server.id);
      else if (action === "stop") await customerApi.stopServer(detail.server.id);
      else if (action === "restart") await customerApi.restartServer(detail.server.id);
      else {
        await customerApi.deleteServer(detail.server.id);
        router.push("/servers");
        return;
      }
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const connect = useMemo(() => {
    if (!detail) return null;
    const port = detail.workload.ports.find((p) => p.internalPort === 25565);
    return {
      hostname: detail.server.hostname,
      directPort: port?.externalPort ?? null
    };
  }, [detail]);

  const copyAddress = async () => {
    if (!connect?.hostname) return;
    try {
      await navigator.clipboard.writeText(connect.hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  if (loading && !detail) {
    return (
      <DashboardShell>
        <p className="text-sm text-slate-500">Loading…</p>
      </DashboardShell>
    );
  }
  if (error && !detail) {
    return (
      <DashboardShell>
        <p className="rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      </DashboardShell>
    );
  }
  if (!detail) return null;

  const { server, workload } = detail;
  const isRunning = server.runtimeState === "running";
  const isStopped = ["stopped", "sleeping", "crashed", "error"].includes(server.runtimeState);
  const isTransitional = !isRunning && !isStopped;

  return (
    <DashboardShell>
      <Link
        href="/servers"
        className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to servers
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {server.templateId} · v{server.minecraftVersion}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">{server.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <RuntimePill state={server.runtimeState} />
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-400">
              <Users className="h-3 w-3" /> {server.currentPlayerCount} / {server.maxPlayers}
            </span>
            {connect?.hostname ? (
              <button
                type="button"
                onClick={copyAddress}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-slate-300 transition hover:bg-white/[0.08]"
                title="Copy server address"
              >
                {connect.hostname}
                <Copy className="h-3 w-3" />
                {copied ? <span className="text-emerald-300">copied</span> : null}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isRunning ? (
            <ActionButton
              label="Restart"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              busy={busy === "restart"}
              onClick={() => void runAction("restart")}
            />
          ) : null}
          {isRunning ? (
            <ActionButton
              label="Stop"
              tone="danger"
              icon={<Pause className="h-3.5 w-3.5" />}
              busy={busy === "stop"}
              onClick={() => void runAction("stop")}
            />
          ) : null}
          {isStopped ? (
            <ActionButton
              label="Start"
              tone="success"
              icon={<Play className="h-3.5 w-3.5" />}
              busy={busy === "start"}
              onClick={() => void runAction("start")}
            />
          ) : null}
          {isTransitional ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 text-xs font-semibold text-amber-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" /> {server.runtimeState}
            </span>
          ) : null}
          <ActionButton
            label="Delete"
            tone="danger-outline"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            busy={busy === "delete"}
            onClick={() => void runAction("delete")}
          />
        </div>
      </header>

      <nav className="mt-8 flex gap-1 border-b border-line">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        <TabButton active={tab === "console"} onClick={() => setTab("console")}>
          <Terminal className="h-3.5 w-3.5" /> Console
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
          <SettingsIcon className="h-3.5 w-3.5" /> Settings
        </TabButton>
      </nav>

      <section className="mt-6">
        {tab === "overview" ? (
          <OverviewPanel detail={detail} />
        ) : tab === "console" ? (
          <ServerConsole serverId={server.id} runtimeState={server.runtimeState} />
        ) : (
          <ServerSettingsForm
            server={server}
            onSaved={(next) => setDetail(next)}
          />
        )}
      </section>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </DashboardShell>
  );
}

function OverviewPanel({ detail }: { detail: ServerDetail }) {
  const { server, workload } = detail;
  const directPort = workload.ports.find((p) => p.internalPort === 25565)?.externalPort;
  const directAddress =
    server.hostname && directPort ? `${server.hostname}:${directPort}` : "—";
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Connection">
        <Row label="Address" value={server.hostname} mono />
        <Row label="Direct port" value={directPort ? `${directPort}/tcp` : "—"} mono />
        <Row label="Direct address" value={directAddress} mono wrap />
      </Card>
      <Card title="Runtime">
        <Row label="State" value={server.runtimeState} />
        <Row label="Players" value={`${server.currentPlayerCount} / ${server.maxPlayers}`} />
        <Row label="Started at" value={formatDate(workload.runtimeStartedAt)} />
        <Row label="Ready at" value={formatDate(server.readyAt)} />
      </Card>
      <Card title="Resources">
        <Row label="CPU" value={`${workload.requestedCpu} vCPU`} />
        <Row label="RAM" value={`${workload.requestedRamMb} MB`} />
        <Row label="Disk" value={`${workload.requestedDiskGb} GB`} />
      </Card>
      <Card title="Configuration">
        <Row label="Difficulty" value={server.difficulty} />
        <Row label="Game mode" value={server.gameMode} />
        <Row label="Online mode" value={server.onlineMode ? "Enabled" : "Disabled"} />
        <Row label="Whitelist" value={server.whitelistEnabled ? "Enabled" : "Disabled"} />
        <Row label="MOTD" value={server.motd ?? "—"} wrap />
      </Card>
      <Card title="AutoSleep">
        <Row label="Enabled" value={server.autoSleepEnabled ? "Yes" : "No"} />
        <Row label="Idle delay" value={`${server.autoSleepIdleMinutes} min`} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/78 p-5 shadow-soft">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <dl className="mt-3 grid gap-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  wrap = false
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className={`text-xs text-slate-200 ${mono ? "font-mono" : ""} ${wrap ? "" : "truncate"}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  busy,
  onClick,
  tone = "neutral"
}: {
  label: string;
  icon: React.ReactNode;
  busy: boolean;
  onClick: () => void;
  tone?: "neutral" | "success" | "danger" | "danger-outline";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200 hover:bg-emerald-400/[0.14]"
      : tone === "danger"
      ? "border-red-500/30 bg-red-500/[0.08] text-red-200 hover:bg-red-500/[0.14]"
      : tone === "danger-outline"
      ? "border-white/10 bg-white/[0.03] text-red-300 hover:bg-red-500/[0.08]"
      : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 ${cls}`}
    >
      {icon}
      {busy ? "…" : label}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition ${
        active
          ? "border-accent text-white"
          : "border-transparent text-slate-500 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function RuntimePill({ state }: { state: string }) {
  const tone =
    state === "running"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200"
      : state === "stopped" || state === "sleeping"
      ? "border-slate-400/20 bg-white/[0.04] text-slate-400"
      : state === "crashed"
      ? "border-red-400/30 bg-red-400/[0.08] text-red-200"
      : "border-amber-400/30 bg-amber-400/[0.08] text-amber-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {state}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
