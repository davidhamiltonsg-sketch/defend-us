import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Dusk room" — a warm, lamplit dark.
        night: {
          DEFAULT: "#15120E",
          raised: "#1E1A15",
          input: "#221D17",
          hair: "#2E2820",
        },
        bone: "#ECE6DA",
        ash: "#B4AB9C",
        smoke: "#857C6E",
        ember: {
          DEFAULT: "#E0A24A",
          soft: "#EEBB73",
          deep: "#B97E32",
        },
        dusk: {
          DEFAULT: "#94A0C6",
          soft: "#AEB8D6",
        },
        moss: {
          DEFAULT: "#8FAE97",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        lamp: "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 70px -28px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(224,162,74,0.20), 0 28px 80px -30px rgba(224,162,74,0.22)",
      },
      letterSpacing: {
        eyebrow: "0.2em",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowpulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.2, 0.6, 0.2, 1) both",
        glowpulse: "glowpulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
