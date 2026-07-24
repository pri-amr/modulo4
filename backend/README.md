# Backend — Finanzas Personales

## Requisitos

- Node.js v24 LTS, pnpm.
- MongoDB configurado como **replica set** (aunque sea de un solo nodo). Las escrituras
  atómicas multi-documento entre `transactions` y `money_sources` (FR-052, research.md §16)
  usan transacciones de Mongoose (`session.withTransaction`), que MongoDB solo soporta sobre
  un replica set — una instancia standalone no alcanza.

### Configurar un replica set de un solo nodo en desarrollo

```bash
mongod --replSet rs0 --dbpath <ruta-de-datos>
```

Con el proceso corriendo, inicializar el replica set una única vez:

```bash
mongosh --eval "rs.initiate()"
```

Luego `MONGODB_URI` debe apuntar a ese mismo `mongod` (ej.
`mongodb://localhost:27017/finanzas?replicaSet=rs0`).

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
