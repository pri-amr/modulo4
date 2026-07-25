"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Loader } from "../components/shared/Loader";

interface LoadingContextValue {
  isLoading: boolean;
  start: () => void;
  stop: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

// Estado global de carga: se activa/desactiva alrededor de cada llamada que pase por
// services/handleRequest.ts, sin que cada pantalla lo gestione a mano (plan.md, "Estado de
// carga global"; FR-045).
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const start = useCallback(() => setCount((current) => current + 1), []);
  const stop = useCallback(() => setCount((current) => Math.max(0, current - 1)), []);

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: count > 0, start, stop }),
    [count, start, stop],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {value.isLoading && <Loader />}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
