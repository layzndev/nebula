"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Server, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { customerApi, type ServerSummary } from "@/lib/api/customer-api";

const REFRESH_MS = 8_000;

export default function ServersPage() {
  const [servers, setServers] = useState<ServerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const result = await customerApi.listServers();
        if (cancelled) return;
        setServers(result.servers);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load servers.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  return (
    <DashboardShell>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Servers</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">My Minecraft servers</h1>
        </div>
        <Link
          href="/servers/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.14] px-4 text-sm font-semibold text-white transition hover:bg-accent/[0.22]"
        >
          <Plus className="h-4 w-4" /> New server
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="mt-6">
        {loading && servers === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : servers && servers.length > 0 ? (
          <ul className="grid gap-3">
            {servers.map((server) => (
              <li key={server.id}>
                <Link
                  href={`/servers/${server.id}`}
                  className="block rounded-2xl border border-line bg-panel/78 p-5 shadow-soft transition hover:border-accent/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08] text-accent">
                        <Server className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{server.name}</p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                          {server.hostname ?? server.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <RuntimePill state={server.runtimeState} />
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        {server.currentPlayerCount}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </section>

      {loading && servers !== null ? (
        <p className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-500">
          <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing…
        </p>
      ) : null}
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-10 text-center">
      <Server className="mx-auto h-8 w-8 text-slate-600" />
      <h2 className="mt-3 text-sm font-semibold text-white">No servers yet</h2>
      <p className="mt-1 text-xs text-slate-500">
        Spin up your first Minecraft server in under a minute.
      </p>
      <Link
        href="/servers/new"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-accent/40 bg-accent/[0.14] px-4 text-xs font-semibold text-white transition hover:bg-accent/[0.22]"
      >
        <Plus className="h-3.5 w-3.5" /> Create my first server
      </Link>
    </div>
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
