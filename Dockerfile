# ============================================================
# 1) Builder – compila, instala devDeps e gera dist/
# ============================================================
FROM node:24-slim AS builder
WORKDIR /app

# Habilitar cache do npm via BuildKit:
# (reduce build time drastically)
RUN --mount=type=cache,target=/root/.npm \
    npm install -g npm@latest

ENV NODE_ENV=development

# Copia apenas manifests para permitir cache do `npm ci`
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Agora copia o restante do código
COPY . .

# Prisma generate
RUN npx prisma generate

# Build do projeto (tsup)
RUN npm run build


# ============================================================
# 2) Runtime super leve – Distroless (node 18+ compat)
# ============================================================
FROM gcr.io/distroless/nodejs24-debian12 AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Copiar apenas o necessário
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3333

# Distroless roda direto o Node
CMD ["dist/index.js"]
