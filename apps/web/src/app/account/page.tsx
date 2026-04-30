"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { customerApi, type NebulaCustomer, type PhantomPing } from "@/lib/api/customer-api";

export default function AccountPage() {
  const [customer, setCustomer] = useState<NebulaCustomer | null>(null);
  const [pingState, setPingState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [pingResult, setPingResult] = useState<PhantomPing | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    customerApi.me().then((response) => {
      if (!cancelled) setCustomer(response.customer);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ping = async () => {
    setPingState("loading");
    setPingError(null);
    try {
      const result = await customerApi.phantomPing();
      setPingResult(result);
      setPingState("ok");
    } catch (error) {
      setPingError(error instanceof Error ? error.message : "Ping failed.");
      setPingState("error");
    }
  };

  return (
    <DashboardShell>
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          {customer?.displayName ?? customer?.email ?? "—"}
        </h1>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel/78 p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-white">Profile</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Email" value={customer?.email ?? "—"} />
            <Row label="Display name" value={customer?.displayName ?? "—"} />
            <Row label="Phantom tenant" value={customer?.phantomTenantId ?? "Not provisioned"} mono />
            <Row label="Member since" value={customer ? new Date(customer.createdAt).toLocaleDateString() : "—"} />
          </dl>
          <p className="mt-4 text-[11px] text-slate-500">
            Profile editing, password change and account deletion land in a future release.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel/78 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Phantom handshake</h3>
              <p className="mt-1 text-xs text-slate-400">
                Smoke test the platform connection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void ping()}
              disabled={pingState === "loading"}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 text-xs font-semibold text-accent transition hover:bg-accent/[0.14] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pingState === "loading" ? "animate-spin" : ""}`} />
              Ping
            </button>
          </div>
          <div className="mt-4">
            {pingState === "ok" && pingResult ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected — {pingResult.tenantCount} tenant
                {pingResult.tenantCount === 1 ? "" : "s"} on Phantom.
              </div>
            ) : pingState === "error" ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-200">
                <XCircle className="mt-0.5 h-3.5 w-3.5" />
                <span>{pingError}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Click Ping to verify the connection.</p>
            )}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-xs text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
