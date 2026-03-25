# ─────────────────────────────────────────────
# Stage 1 : Build (génération SSG)
# ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Outils de compilation nécessaires pour better-sqlite3 (module natif)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances en premier
# pour profiter du cache Docker layer
COPY package*.json ./

RUN npm ci --frozen-lockfile --legacy-peer-deps

# Copier le reste des sources
COPY . .

# Générer le site statique
RUN npm run generate

# ─────────────────────────────────────────────
# Stage 2 : Production (nginx minimaliste)
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier uniquement les fichiers statiques générés
COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/robots.txt || exit 1

CMD ["nginx", "-g", "daemon off;"]
