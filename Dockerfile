# ===================================================
# Multi-stage Dockerfile para Cevichería La Barra
# ===================================================

# --- ETAPA 1: Construcción del Cliente (Frontend) ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- ETAPA 2: Construcción del Servidor (Backend) ---
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# --- ETAPA 3: Imagen Final de Producción ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PROVIDER=local

# Copiar dependencias de producción del servidor
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

# Copiar artefactos compilados
COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist /app/client/dist

WORKDIR /app
EXPOSE 4000

CMD ["node", "server/dist/index.js"]
