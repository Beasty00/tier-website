import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#050505",
        card: "#121212",
        panel: "#191919",
        line: "#2a2a2a",
        emerald: "#ef4444",
        lava: "#ff7a1a",
        gold: "#ffd166",
        diamond: "#3b82f6"
      },
      borderRadius: {
        card: "20px"
      },
      boxShadow: {
        glow: "0 0 60px rgba(239, 68, 68, 0.18)",
        card: "0 22px 80px rgba(0, 0, 0, 0.42)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.08)"
      },
      fontFamily: {
        display: ["Space Grotesk", "Rajdhani", "Trebuchet MS", "sans-serif"],
        body: ["Outfit", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "monospace"]
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        ore: "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.16), transparent 28%), radial-gradient(circle at 78% 12%, rgba(59,130,246,0.14), transparent 30%), radial-gradient(circle at 50% 80%, rgba(255,122,26,0.1), transparent 34%)"
      }
    }
  },
  plugins: []
};

export default config;
