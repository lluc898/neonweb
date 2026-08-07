# ------------------------------------------------------------------
# Neon Led Spain — imagen de producción (Next.js 16 standalone)
# Multi-stage: se compila con todas las dependencias y la imagen final
# solo lleva el bundle autocontenido que genera `output: "standalone"`.
# ------------------------------------------------------------------

# ----------------------------------------------------------- builder
FROM node:22-alpine AS builder

# Next.js y algunas dependencias nativas necesitan glibc-compat en Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Dependencias primero para aprovechar la caché de capas.
# `postinstall` ejecuta `prisma generate`, por eso copiamos ya el esquema.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Código fuente. El .env aporta las NEXT_PUBLIC_* que Next inlinea en el
# bundle durante el build (solo en esta etapa; no llega a la imagen final).
COPY . .

# Regeneramos el cliente Prisma ahora que `lib/` existe en el contexto:
# el generador escribe en lib/generated/prisma (gitignored).
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ------------------------------------------------------------ runner
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios.
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
