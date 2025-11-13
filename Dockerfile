# builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
# Ao iniciar, aplica migrations e sobe a app
CMD ["sh", "-lc", "npx prisma migrate deploy && node dist/index.js"]


# https://panel.smarttcode.com.br/api/stacks/webhooks/1f5b0fe4-8c25-45ea-bab1-5fa3a29c5c32