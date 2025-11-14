# ============================================================
# 1) Builder – compila e instala dependências
# ============================================================
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependências mínimas do sistema (Prisma precisa de OpenSSL)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Atualizar npm
RUN npm install -g npm@latest

ENV NODE_ENV=development

# Copiar package files
COPY package*.json ./

# Instalar dependências (agora sem phantomjs!)
RUN npm ci

# Copiar código fonte
COPY . .

# Prisma generate
RUN npx prisma generate

# Build do projeto
RUN npm run build

# Remover devDependencies para reduzir tamanho
RUN npm prune --production

# ============================================================
# 2) Runtime – Imagem final otimizada
# ============================================================
FROM node:20-slim AS runtime

WORKDIR /app

# Instalar apenas OpenSSL (Prisma precisa)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para segurança
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

ENV NODE_ENV=production

# Copiar apenas o necessário do builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

# Mudar para usuário não-root
USER nodejs

EXPOSE 3333

# Healthcheck (descomente e ajuste o endpoint conforme sua API)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3333/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "dist/index.js"]