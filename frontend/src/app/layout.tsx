import type { ReactNode } from "react";
import { LoadingProvider } from "../providers/LoadingProvider";
import "./globals.css";

export const metadata = {
  title: "Finanzas Personales",
};

// Server Component (SSR), sin "use client": modo oscuro habilitado por defecto (plan.md,
// "Componentes base") y LoadingProvider (componente cliente) montado acá para que cualquier
// pantalla lo use sin gestionarlo manualmente (FR-045).
export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
