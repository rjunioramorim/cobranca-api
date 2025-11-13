# 📊 Schema do Banco de Dados

## Models

### Cliente
Armazena informações dos clientes que recebem cobranças recorrentes.

**Campos:**
- `id` (UUID) - Identificador único
- `nome` (String, 255) - Nome do cliente
- `telefone` (String, 20) - Telefone para WhatsApp
- `valor` (Float) - Valor da cobrança recorrente
- `diaVencimento` (Int) - Dia do mês (1-31) para vencimento
- `ativo` (Boolean) - Se o cliente está ativo (default: true)
- `observacoes` (Text, opcional) - Observações sobre o cliente
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Relacionamentos:**
- Um cliente pode ter várias cobranças (`cobrancas`)

**Índices:**
- `ativo` - Para filtrar clientes ativos
- `telefone` - Para buscar por telefone

### Cobranca
Armazena as cobranças geradas para os clientes.

**Campos:**
- `id` (UUID) - Identificador único
- `clienteId` (UUID) - Referência ao cliente
- `valor` (Float) - Valor da cobrança
- `vencimento` (DateTime) - Data de vencimento
- `status` (String, 20) - Status: PENDENTE, PAGO, ATRASADO (default: PENDENTE)
- `pixQrCode` (Text, opcional) - QR Code do Pix
- `pixCopiaECola` (Text, opcional) - Código Copia e Cola do Pix
- `pagoEm` (DateTime, opcional) - Data do pagamento
- `observacoes` (Text, opcional) - Observações sobre a cobrança
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Relacionamentos:**
- Pertence a um cliente (`cliente`)

**Índices:**
- `clienteId` - Para buscar cobranças de um cliente
- `vencimento` - Para buscar por data de vencimento
- `status` - Para filtrar por status
- `vencimento, status` - Índice composto para consultas frequentes

### Configuracao
Armazena configurações gerais e templates de mensagens.

**Campos:**
- `id` (UUID) - Identificador único
- `chave` (String, 100, único) - Chave da configuração
- `valor` (Text) - Valor da configuração (pode ser JSON para templates)
- `descricao` (String, 500, opcional) - Descrição da configuração
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Exemplos de chaves:**
- `template_cobranca` - Template de mensagem para cobrança
- `template_lembrete` - Template de mensagem para lembrete
- `template_inadimplencia` - Template de mensagem para inadimplência
- `whatsapp_api_url` - URL da API do WhatsApp
- `pix_api_provider` - Provedor da API Pix (MERCADO_PAGO, GERENCIANET)

**Índices:**
- `chave` - Para buscar configurações rapidamente

## Comandos Úteis

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# Abrir Prisma Studio (interface visual)
npm run prisma:studio

# Resetar banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Aplicar migrations em produção
npx prisma migrate deploy
```

## Migrations

As migrations são criadas automaticamente quando você executa `npm run prisma:migrate`. Elas ficam em `prisma/migrations/`.

