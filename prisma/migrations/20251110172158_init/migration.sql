-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobranca" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "pixQrCode" TEXT,
    "pixCopiaECola" TEXT,
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cliente_ativo_idx" ON "Cliente"("ativo");

-- CreateIndex
CREATE INDEX "Cliente_telefone_idx" ON "Cliente"("telefone");

-- CreateIndex
CREATE INDEX "Cobranca_clienteId_idx" ON "Cobranca"("clienteId");

-- CreateIndex
CREATE INDEX "Cobranca_vencimento_idx" ON "Cobranca"("vencimento");

-- CreateIndex
CREATE INDEX "Cobranca_status_idx" ON "Cobranca"("status");

-- CreateIndex
CREATE INDEX "Cobranca_vencimento_status_idx" ON "Cobranca"("vencimento", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracao_chave_key" ON "Configuracao"("chave");

-- CreateIndex
CREATE INDEX "Configuracao_chave_idx" ON "Configuracao"("chave");

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
