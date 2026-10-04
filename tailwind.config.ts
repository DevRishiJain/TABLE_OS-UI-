import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TableOS v4 warm dark palette
        background: "var(--bg)",
        panel: "var(--panel)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        brand: "var(--b)",
        brand2: "var(--b2)",
        ok: "var(--ok)",
        late: "var(--late)",

        // Legacy compat aliases
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          subtle: "rgb(var(--surface-subtle-rgb) / <alpha-value>)",
          border: "var(--surface-border-color)",
          hover: "rgb(var(--surface-hover-rgb) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "var(--b)",
          hover: "var(--b2)",
          glow: "var(--theme-primary-glow, color-mix(in srgb, var(--b) 25%, transparent))",
          dark: "var(--theme-primary-dark, var(--b2))",
        },
      },
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Hanken Grotesk", "Segoe UI", "system-ui", "sans-serif"],
        // legacy
        display: ["Instrument Serif", "Georgia", "serif"],
      },
      borderColor: {
        "surface-border": "var(--line)",
      },
      boxShadow: {
        brand: "0 12px 40px -12px var(--b)",
        glow: "0 0 30px -5px var(--b)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(40px)" },
        },
        pop: {
          from: { transform: "scale(0.9)", opacity: "0" },
        },
        ping: {
          from: { transform: "scale(0.6)", opacity: "0.9" },
          to: { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        rise: "rise 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        pop: "pop 0.5s ease both",
        ping: "ping 1.6s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
