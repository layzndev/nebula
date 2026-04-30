"use client";

import { useState } from "react";
import { customerApi, type ServerDetail, type UpdateServerSettingsInput } from "@/lib/api/customer-api";

const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"] as const;
const GAME_MODES = ["survival", "creative", "adventure", "spectator"] as const;

export function ServerSettingsForm({
  server,
  onSaved
}: {
  server: ServerDetail["server"];
  onSaved: (next: ServerDetail) => void;
}) {
  const [motd, setMotd] = useState(server.motd ?? "");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>(
    (DIFFICULTIES.find((option) => option === server.difficulty) ?? "normal") as (typeof DIFFICULTIES)[number]
  );
  const [gameMode, setGameMode] = useState<(typeof GAME_MODES)[number]>(
    (GAME_MODES.find((option) => option === server.gameMode) ?? "survival") as (typeof GAME_MODES)[number]
  );
  const [maxPlayers, setMaxPlayers] = useState(server.maxPlayers);
  const [whitelistEnabled, setWhitelistEnabled] = useState(server.whitelistEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: UpdateServerSettingsInput = {
        motd: motd.trim() || undefined,
        difficulty,
        gameMode,
        maxPlayers,
        whitelistEnabled
      };
      const result = await customerApi.updateServerSettings(server.id, payload);
      onSaved(result.server);
      setSavedAt(Date.now());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-line bg-panel/78 p-6 shadow-soft">
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">
        Settings changes only take effect after the next server restart. Use the
        Restart button on the overview tab once you save.
      </div>

      <Field label="MOTD">
        <input
          type="text"
          value={motd}
          onChange={(event) => setMotd(event.target.value)}
          maxLength={120}
          placeholder="Welcome to the server"
          className="h-11 w-full rounded-xl border border-white/10 bg-obsidian px-3 text-sm text-white outline-none focus:border-accent/40"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Difficulty">
          <Select
            value={difficulty}
            onChange={(value) => setDifficulty(value as typeof difficulty)}
            options={DIFFICULTIES}
          />
        </Field>
        <Field label="Game mode">
          <Select
            value={gameMode}
            onChange={(value) => setGameMode(value as typeof gameMode)}
            options={GAME_MODES}
          />
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

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-obsidian px-4 py-3">
        <input
          type="checkbox"
          checked={whitelistEnabled}
          onChange={(event) => setWhitelistEnabled(event.target.checked)}
          className="h-4 w-4 cursor-pointer accent-accent"
        />
        <div>
          <p className="text-sm font-semibold text-white">Whitelist enabled</p>
          <p className="text-xs text-slate-500">
            Only players added to the whitelist will be able to join.
          </p>
        </div>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}
      {savedAt ? (
        <p className="text-xs text-emerald-300">Saved.</p>
      ) : null}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.14] px-5 text-sm font-semibold text-white transition hover:bg-accent/[0.22] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
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
