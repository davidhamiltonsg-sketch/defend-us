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
        ink: {
          DEFAULT: "#1c1b1a",
          soft: "#3a3836",
          muted: "#6b6864",
        },
        paper: {
          DEFAULT: "#f6f3ee",
          card: "#fffdf9",
          edge: "#e7e1d7",
        },
        clay: {
          DEFAULT: "#b5654a",
          soft: "#cf8a72",
          wash: "#f0e2da",
        },
        sage: {
          DEFAULT: "#5f7355",
          wash: "#e6ebe1",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
