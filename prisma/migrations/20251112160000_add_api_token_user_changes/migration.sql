-- Adicionar colunas de token de integração ao tenant
ALTER TABLE "tenants"
ADD COLUMN "apiTokenId" VARCHAR(100),
ADD COLUMN "apiTokenHash" VARCHAR(255);

-- Garantir unicidade do apiTokenId (ignorando valores nulos)
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_apiTokenId_key" ON "tenants"("apiTokenId");

-- Permitir que usuários admin não tenham tenant associado
ALTER TABLE "users"
ALTER COLUMN "tenantId" DROP NOT NULL;
