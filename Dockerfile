# ─────────────────────────────────────────────
# Stage 1 : Build (SSR)
# ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --frozen-lockfile --legacy-peer-deps

COPY . .

# SSR build — les variables Supabase ne sont pas nécessaires au build,
# seulement à l'exécution (runtime config)
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 : Production (Node.js SSR)
# ─────────────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Copier uniquement le serveur compilé
COPY --from=builder /app/.output /app/.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/robots.txt || exit 1

CMD ["node", ".output/server/index.mjs"]
