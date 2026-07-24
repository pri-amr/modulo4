# Backend — Finanzas Personales

## Requisitos

- Node.js v24 LTS, pnpm.
- MongoDB, instancia standalone estándar — **no requiere replica set**. El recálculo del monto
  de una fuente de dinero (FR-052) no usa transacciones multi-documento de Mongo; se hace con
  dos escrituras secuenciales y un rollback de compensación a nivel de aplicación si la segunda
  falla (research.md §16). Se optó por este enfoque porque la app es de un único usuario por
  cuenta, sin escrituras concurrentes reales, y así se evita exigir reconfigurar el servidor
  MongoDB del equipo.

## Cifrado en reposo (FR-034)

Cifrado a nivel de almacenamiento/volumen de MongoDB (encrypted storage engine si es
self-hosted, o cifrado gestionado por el proveedor si es managed) — research.md §4. No se
agrega cifrado a nivel de campo en la aplicación.

## Correr

```bash
pnpm install
pnpm dev
pnpm jest
```
