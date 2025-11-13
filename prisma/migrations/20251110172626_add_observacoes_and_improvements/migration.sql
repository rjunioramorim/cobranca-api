/*
  Warnings:

  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cobranca` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Configuracao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cobranca" DROP CONSTRAINT "Cobranca_clienteId_fkey";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Cobranca";

-- DropTable
DROP TABLE "Configuracao";

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobrancas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    "pixQrCode" TEXT,
    "pixCopiaECola" TEXT,
    "pagoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobrancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_ativo_idx" ON "clientes"("ativo");

-- CreateIndex
CREATE INDEX "clientes_telefone_idx" ON "clientes"("telefone");

-- CreateIndex
CREATE INDEX "cobrancas_clienteId_idx" ON "cobrancas"("clienteId");

-- CreateIndex
CREATE INDEX "cobrancas_vencimento_idx" ON "cobrancas"("vencimento");

-- CreateIndex
CREATE INDEX "cobrancas_status_idx" ON "cobrancas"("status");

-- CreateIndex
CREATE INDEX "cobrancas_vencimento_status_idx" ON "cobrancas"("vencimento", "status");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE INDEX "configuracoes_chave_idx" ON "configuracoes"("chave");

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
