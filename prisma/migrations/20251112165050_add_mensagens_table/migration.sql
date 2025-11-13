-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cobrancaId" TEXT,
    "clienteId" TEXT NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AGENDADA',
    "dataAgendamento" TIMESTAMP(3),
    "dataEnvio" TIMESTAMP(3),
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensagens_tenantId_idx" ON "mensagens"("tenantId");

-- CreateIndex
CREATE INDEX "mensagens_clienteId_idx" ON "mensagens"("clienteId");

-- CreateIndex
CREATE INDEX "mensagens_cobrancaId_idx" ON "mensagens"("cobrancaId");

-- CreateIndex
CREATE INDEX "mensagens_status_idx" ON "mensagens"("status");

-- CreateIndex
CREATE INDEX "mensagens_dataAgendamento_idx" ON "mensagens"("dataAgendamento");

-- CreateIndex
CREATE INDEX "mensagens_dataEnvio_idx" ON "mensagens"("dataEnvio");

-- CreateIndex
CREATE INDEX "mensagens_tenantId_status_idx" ON "mensagens"("tenantId", "status");

-- CreateIndex
CREATE INDEX "mensagens_tenantId_dataEnvio_idx" ON "mensagens"("tenantId", "dataEnvio");

-- CreateIndex
CREATE INDEX "tenants_apiTokenId_idx" ON "tenants"("apiTokenId");

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "cobrancas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
