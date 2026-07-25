import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos respaldados por variables CSS (globals.css :root/.dark); un
        // componente solo necesita `bg-surface`, no `bg-x dark:bg-y` — el valor cambia solo
        // al alternar la clase `dark` en <html> (FR-054, plan.md "Paleta de color").
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--color-fg-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-blue": "rgb(var(--color-accent-blue) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
      },
      borderRadius: {
        field: "10px",
      },
      keyframes: {
        "loader-dash": {
          "0%": { "stroke-dasharray": "1, 150", "stroke-dashoffset": "0" },
          "50%": { "stroke-dasharray": "90, 150", "stroke-dashoffset": "-35" },
          "100%": { "stroke-dasharray": "90, 150", "stroke-dashoffset": "-124" },
        },
      },
      animation: {
        // Arco que crece y se achica mientras el spinner completo gira (FR-055).
        "loader-dash": "loader-dash 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
