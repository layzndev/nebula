"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Server, User } from "lucide-react";
import { customerApi, type NebulaCustomer } from "@/lib/api/customer-api";

const NAV = [
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/account", label: "Account", icon: User }
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<NebulaCustomer | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    customerApi
      .me()
      .then((response) => {
        if (!cancelled) setCustomer(response.customer);
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

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

  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(167,139,250,0.10),transparent_55%)]" />

      <aside className="relative z-10 flex w-60 shrink-0 flex-col border-r border-line bg-panel/78 px-4 py-6">
        <Link href="/servers" className="flex items-center gap-2 px-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08]">
            <span className="absolute h-4 w-4 rounded-full border border-accent/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">Nebula</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-accent/[0.12] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="truncate text-xs text-slate-300">
            {customer?.displayName ?? customer?.email ?? "—"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{customer?.email}</p>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
