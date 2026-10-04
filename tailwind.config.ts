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
        background: "var(--background)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          subtle: "rgb(var(--surface-subtle-rgb) / <alpha-value>)",
          border: "var(--surface-border-color)",
          hover: "rgb(var(--surface-hover-rgb) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--theme-primary-rgb) / <alpha-value>)",
          hover: "var(--theme-primary-hover, #D4982E)",
          glow: "var(--theme-primary-glow, rgba(229, 169, 60, 0.15))",
          dark: "var(--theme-primary-dark, #A3721A)",
        },
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        emerald: {
          500: "#10B981",
          600: "#059669",
        },
        crimson: {
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px var(--theme-primary-glow, rgba(229, 169, 60, 0.25))",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
