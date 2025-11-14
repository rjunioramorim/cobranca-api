# ============================================================
# 1) Builder – compila e instala dependências
# ============================================================
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@latest

ENV NODE_ENV=development

# Copiar package files
COPY package*.json ./

# Instalar todas as dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Prisma generate
RUN npx prisma generate

# Build do projeto
RUN npm run build

# Remover devDependencies após build
RUN npm prune --production --legacy-peer-deps

# ============================================================
# 2) Runtime – Imagem final
# ============================================================
FROM node:20-slim AS runtime

WORKDIR /app

# Instalar apenas OpenSSL (necessário para Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

ENV NODE_ENV=production

# Copiar apenas produção (após prune)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

USER nodejs

EXPOSE 3333

CMD ["node", "dist/index.js"]