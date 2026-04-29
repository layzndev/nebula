import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(167,139,250,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_110%,rgba(34,211,238,0.10),transparent_55%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <NebulaMark />
          <span className="text-lg font-bold tracking-tight text-white">Nebula</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/[0.12] px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/[0.2]"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Beta — invite-only
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Minecraft hosting,
          <br />
          <span className="bg-gradient-to-r from-accent via-fuchsia-300 to-glow bg-clip-text text-transparent">
            built on Phantom.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Spin up a Minecraft server in seconds. Auto-sleep when no one is playing.
          Wake on first packet. Pay only for what you actually use.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.14] px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/[0.22]"
          >
            Create your free server <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </main>
  );
}

function NebulaMark() {
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08] shadow-[0_0_30px_rgba(167,139,250,0.18)]">
      <span className="absolute h-5 w-5 rounded-full border border-accent/40" />
      <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
    </span>
  );
}
