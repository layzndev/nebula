"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { customerApi, type CreateServerInput } from "@/lib/api/customer-api";

const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"] as const;
const GAME_MODES = ["survival", "creative", "adventure", "spectator"] as const;

export default function NewServerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hostnameSlug, setHostnameSlug] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("normal");
  const [gameMode, setGameMode] = useState<(typeof GAME_MODES)[number]>("survival");
  const [maxPlayers, setMaxPlayers] = useState<number>(20);
  const [motd, setMotd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: CreateServerInput = {
        name,
        difficulty,
        gameMode,
        maxPlayers,
        ...(hostnameSlug ? { hostnameSlug } : {}),
        ...(motd ? { motd } : {})
      };
      const result = await customerApi.createServer(payload);
      router.push(`/servers/${result.server.server.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Provisioning failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell>
      <Link
        href="/servers"
        className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to servers
      </Link>

      <header className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">New server</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          Spin up a Minecraft server
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Defaults are tuned for the Free tier (1 vCPU, 2&nbsp;GB RAM, 5&nbsp;GB disk).
          You can change settings later.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-line bg-panel/78 p-6 shadow-soft"
      >
        <Field label="Server name" required>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={60}
            placeholder="My Minecraft server"
            className="h-11 w-full rounded-xl border border-white/10 bg-obsidian px-3 text-sm text-white outline-none focus:border-accent/40"
          />
        </Field>

        <Field label="Hostname (optional)">
          <div className="flex items-center rounded-xl border border-white/10 bg-obsidian px-3">
            <input
              type="text"
              value={hostnameSlug}
              onChange={(event) =>
                setHostnameSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="auto"
              maxLength={32}
              className="h-11 flex-1 bg-transparent text-sm text-white outline-none"
            />
            <span className="text-xs text-slate-500">.nptnz.co.uk</span>
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Difficulty">
            <Select value={difficulty} onChange={(value) => setDifficulty(value as typeof difficulty)} options={DIFFICULTIES} />
          </Field>
          <Field label="Game mode">
            <Select value={gameMode} onChange={(value) => setGameMode(value as typeof gameMode)} options={GAME_MODES} />
          </Field>
          <Field label="Max players">
            <input
              type="number"
              min={1}
              max={500}
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(Number(event.target.value) || 20)}
              className="h-11 w-full rounded-xl border border-white/10 bg-obsidian px-3 text-sm text-white outline-none focus:border-accent/40"
            />
          </Field>
        </div>

        <Field label="MOTD (optional)">
          <input
            type="text"
            value={motd}
            onChange={(event) => setMotd(event.target.value)}
            maxLength={120}
            placeholder="Welcome to my server"
            className="h-11 w-full rounded-xl border border-white/10 bg-obsidian px-3 text-sm text-white outline-none focus:border-accent/40"
          />
        </Field>

        {error ? (
          <p className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/servers"
            className="text-xs text-slate-500 transition hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy || name.trim().length < 2}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.14] px-5 text-sm font-semibold text-white transition hover:bg-accent/[0.22] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Provisioning…" : "Create server"}
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label} {required ? <span className="text-accent">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-white/10 bg-obsidian px-3 text-sm text-white outline-none focus:border-accent/40"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
