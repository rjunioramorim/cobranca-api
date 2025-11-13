# 💰 API de Cobrança Automática via WhatsApp + Pix

Sistema de gestão e automação de cobranças recorrentes com integração Pix e WhatsApp.

## 🚀 Tecnologias

- **Node.js 20+** com TypeScript
- **Fastify** - Framework web rápido
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados
- **Zod** - Validação de schemas

## 📋 Pré-requisitos

- Node.js 20+
- PostgreSQL instalado e rodando
- npm ou yarn

## 🔧 Instalação

1. Instalar dependências:

```bash
npm install
```

2. Configurar variáveis de ambiente:

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
PORT=3333
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/cobranca_auto?schema=public"
```

3. Configurar banco de dados:

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate
```

4. Iniciar servidor:

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em produção
- `npm run type-check` - Verifica tipos TypeScript
- `npm run format` - Formata código com Biome
- `npm run lint` - Verifica código com Biome
- `npm run prisma:generate` - Gera Prisma Client
- `npm run prisma:migrate` - Executa migrations
- `npm run prisma:studio` - Abre Prisma Studio

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/       # Configurações (env, etc)
│   ├── controllers/ # Controllers das rotas
│   ├── routes/      # Definição das rotas
│   ├── services/    # Lógica de negócio
│   ├── types/       # Tipos TypeScript
│   ├── utils/       # Utilitários
│   └── index.ts     # Entry point
├── prisma/
│   └── schema.prisma # Schema do banco de dados
└── package.json
```

## 🧪 Testando

Acesse o health check:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📚 Próximos Passos

- [ ] Implementar CRUD de clientes
- [ ] Implementar CRUD de cobranças
- [ ] Integração com API Pix
- [ ] Integração com WhatsApp
- [ ] Automação de envio de mensagens

