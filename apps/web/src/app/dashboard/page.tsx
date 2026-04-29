"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, RefreshCw, ServerCog, XCircle } from "lucide-react";
import { customerApi, type NebulaCustomer, type PhantomPing } from "@/lib/api/customer-api";

export default function DashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<NebulaCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [pingState, setPingState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [pingResult, setPingResult] = useState<PhantomPing | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    customerApi
      .me()
      .then((response) => {
        if (cancelled) return;
        setCustomer(response.customer);
      })
      .catch(() => {
        if (cancelled) return;
        router.push("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

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

  const signOut = async () => {
    setSigningOut(true);
    try {
      await customerApi.logout();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return <p className="p-10 text-sm text-slate-500">Loading…</p>;
  }
  if (!customer) return null;

  return (
    <main className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(167,139,250,0.12),transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h1 className="font-display text-2xl font-bold text-white">
              {customer.displayName ?? customer.email}
            </h1>
            <p className="mt-1 text-xs text-slate-400">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-line bg-panel/78 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08] text-accent">
              <ServerCog className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">My Minecraft servers</h2>
              <p className="mt-1 text-xs text-slate-400">
                You don't have any servers yet. Provisioning lands in the next release.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel/78 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Phantom handshake</h2>
              <p className="mt-1 text-xs text-slate-400">
                Smoke test that this Nebula instance can reach the Phantom platform API
                with its configured token.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void ping()}
              disabled={pingState === "loading"}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 text-xs font-semibold text-accent transition hover:bg-accent/[0.14] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pingState === "loading" ? "animate-spin" : ""}`} />
              Ping Phantom
            </button>
          </div>

          <div className="mt-4">
            {pingState === "ok" && pingResult ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected — {pingResult.tenantCount} tenant
                {pingResult.tenantCount === 1 ? "" : "s"} on Phantom side. Last checked{" "}
                {new Date(pingResult.checkedAt).toLocaleTimeString()}.
              </div>
            ) : null}
            {pingState === "error" ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-200">
                <XCircle className="mt-0.5 h-3.5 w-3.5" />
                <span>{pingError}</span>
              </div>
            ) : null}
            {pingState === "idle" ? (
              <p className="text-xs text-slate-500">Click "Ping Phantom" to verify the connection.</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
