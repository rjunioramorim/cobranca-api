/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,chave]` on the table `configuracoes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `cobrancas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `configuracoes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "configuracoes_chave_key";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "cobrancas" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "configuracoes" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_ativo_idx" ON "tenants"("ativo");

-- CreateIndex
CREATE INDEX "clientes_tenantId_idx" ON "clientes"("tenantId");

-- CreateIndex
CREATE INDEX "clientes_tenantId_ativo_idx" ON "clientes"("tenantId", "ativo");

-- CreateIndex
CREATE INDEX "clientes_tenantId_telefone_idx" ON "clientes"("tenantId", "telefone");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_idx" ON "cobrancas"("tenantId");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_vencimento_idx" ON "cobrancas"("tenantId", "vencimento");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_status_idx" ON "cobrancas"("tenantId", "status");

-- CreateIndex
CREATE INDEX "configuracoes_tenantId_idx" ON "configuracoes"("tenantId");

-- CreateIndex
CREATE INDEX "configuracoes_tenantId_chave_idx" ON "configuracoes"("tenantId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_tenantId_chave_key" ON "configuracoes"("tenantId", "chave");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
