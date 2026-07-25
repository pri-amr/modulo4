"use client";

import { useEffect } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useThemeStore } from "../../stores/themeStore";

// Ícono fijo, visible en toda pantalla (incluidas Login/Registro, antes de autenticarse),
// para alternar entre modo claro y modo oscuro (FR-054, plan.md "Componentes base").
export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const label = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-fg shadow hover:bg-accent-blue hover:text-white"
    >
      {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
