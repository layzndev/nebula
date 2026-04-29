import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nebula identity — violet/cyan, distinct from Phantom emerald.
        midnight: "#06060c",
        obsidian: "#0b0b14",
        panel: "#11111d",
        line: "rgba(167, 139, 250, 0.12)",
        accent: "#a78bfa",
        glow: "#22d3ee"
      },
      fontFamily: {
        display: ["'Geist Sans'", "Inter", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "ui-monospace", "monospace"]
      },
      boxShadow: {
        soft: "0 12px 48px rgba(167, 139, 250, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
