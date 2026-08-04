# Neon Led Spain — Tienda online

E-commerce de neones LED decorativos y **personalizados**, con configurador en vivo y panel de administración.

- **Stack**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 · Supabase (Postgres + Storage) · Framer Motion
- **Arquitectura y decisiones**: ver [`CLAUDE.md`](./CLAUDE.md) (fuente de verdad del proyecto)

## Desarrollo

```bash
npm install               # instala deps y genera el cliente Prisma
cp .env.example .env      # rellena credenciales (Supabase, ADMIN_PASSWORD)
npx prisma db push        # sincroniza el esquema con la BD
npm run db:seed           # datos iniciales (categorías, productos, precios)
npx tsx scripts/setup-storage.mts  # crea el bucket de Storage (una vez)
npm run dev               # http://localhost:3000
```

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Home |
| `/productos` | Catálogo con filtros y paginación |
| `/personalizar` | ⭐ Configurador de neón con preview y precio en vivo |
| `/diseno-a-medida` | Subida de imagen + solicitud de presupuesto |
| `/carrito` | Carrito |
| `/admin` | Panel de gestión (pedidos, solicitudes, productos, precios) |

## Producción (self-host)

```bash
npm run build   # genera .next/standalone (output: standalone)
npm start       # detrás de nginx como reverse proxy
```
