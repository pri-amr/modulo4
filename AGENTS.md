# AGENTS.md

## Propósito
Aplicación web de finanzas personales para usuarios argentinos. Centraliza el registro de ingresos y egresos en múltiples bancos y efectivo (ARS/USD), con acceso mediante passkeys o contraseña, a elección del usuario.

## Stack
- Frontend: Next.js 16 (React 19) + TypeScript 6 con Tailwind 4, axios y next-auth 4, carpeta `frontend/`
- Backend: Node.js + Express + TypeScript 6, carpeta `backend/` (separada del frontend)
- Node.js: v24 LTS
- Base de datos: MongoDB en `{mimongo}`
- Gestor de paquetes: pnpm
- Testing: Jest
- La arquitectura del frontend es por funcionalidad. Usar skills /senior-frontend y /senior-architect.
- La arquitectura del backend debe ser DDD y CQRS. Usar skills /create-module y /init-architecture.

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
- Sin comentarios salvo que expliquen un POR QUÉ no obvio (restricción oculta, workaround, invariante sutil). Nunca comentar QUÉ hace el código.
- No implementar passkeys primero. Se implementa todo con usuario y contraseña, en última instancia (cuando todo está terminado), se agrega la posibilidad de ingresar con passkeys
- No instales paquetes de npm de menos de tres días de antiguedad, pero siempre usa las versiones más recientes que puedas de cualquier paquete que instales.