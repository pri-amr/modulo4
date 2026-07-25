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
        accent: {
          DEFAULT: "#3b82f6",
          light: "#60a5fa",
        },
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
