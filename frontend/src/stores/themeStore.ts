import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

// Modo oscuro por defecto, con alternancia a modo claro (FR-054). La preferencia se persiste
// en localStorage vía el middleware `persist`; si en la práctica aparece un parpadeo del tema
// por defecto antes de la hidratación (FOUC en SSR), se migra a leer la preferencia desde una
// cookie en el servidor (plan.md, "Componentes base").
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    { name: "theme-preference" },
  ),
);
