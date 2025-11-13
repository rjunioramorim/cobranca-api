# builder
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# runtime
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3333
CMD ["sh", "-lc", "npx prisma migrate deploy && node dist/index.js"]
