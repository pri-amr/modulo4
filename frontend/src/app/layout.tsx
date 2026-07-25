import type { ReactNode } from "react";
import { LoadingProvider } from "../providers/LoadingProvider";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import "./globals.css";

export const metadata = {
  title: "Finanzas Personales",
};

// Server Component (SSR), sin "use client": modo oscuro habilitado por defecto (plan.md,
// "Componentes base"), LoadingProvider (FR-045) y ThemeToggle (FR-054, ícono fijo visible en
// toda pantalla) montados acá para que cualquier pantalla los use sin gestionarlos manualmente.
export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <ThemeToggle />
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
