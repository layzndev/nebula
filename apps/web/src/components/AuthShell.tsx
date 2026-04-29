import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(167,139,250,0.18),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08]">
            <span className="absolute h-4 w-4 rounded-full border border-accent/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
          </span>
          <span className="text-sm font-semibold text-slate-300">Nebula</span>
        </Link>

        <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>

        <div className="mt-8 rounded-2xl border border-line bg-panel/78 p-6 shadow-soft">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-xs text-slate-500">{footer}</div> : null}
      </div>
    </main>
  );
}
