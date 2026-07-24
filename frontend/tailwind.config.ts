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
    },
  },
  plugins: [],
};

export default config;
