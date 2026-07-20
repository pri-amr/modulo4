# AGENTS.md

## Propósito
Aplicación web de finanzas personales para usuarios argentinos. Centraliza el registro de ingresos y egresos en múltiples bancos y efectivo (ARS/USD), con acceso mediante passkeys o contraseña, a elección del usuario.

## Stack
- Frontend: Next.js (React) + TypeScript con Tailwind , axios y next-auth, carpeta `frontend/`
- Backend: Node.js + Express, carpeta `backend/` (separada del frontend)
- Node.js: v24 LTS
- Base de datos: MongoDB en `{mimongo}`
- Gestor de paquetes: pnpm
- Testing: Jest

## Cómo correr
Frontend:
```
cd frontend
pnpm install
pnpm dev
pnpm jest
```

Backend:
```
cd backend
pnpm install
pnpm dev
pnpm jest
```

## Qué NO hacer
- No permitir que un usuario se autentique con un método distinto al que eligió en su registro (passkey o contraseña, no ambos) (RF01-RF02).
- No permitir eliminar la última passkey activa de una cuenta; siempre debe quedar al menos una (RF33).
- No mostrar ningún valor de conversión si la API de dolarapi.com falla o no responde; mostrar error explícito en su lugar (RF30).
