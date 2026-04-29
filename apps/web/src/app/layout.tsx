import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Nebula — Hosting",
  description: "Hosting product for the Phantom control plane.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-midnight text-slate-200">
        {children}
      </body>
    </html>
  );
}
