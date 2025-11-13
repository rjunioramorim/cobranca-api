import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NotFoundError, ValidationError } from "../utils/errors";

export class IntegrationTokenService {
    /**
     * Gera um token de integração permanente para um tenant
     * Formato: api_<tokenId>.<secret>
     */
    async generate(tenantId: string): Promise<string> {
        // Verificar se o tenant existe e está ativo
        const tenant = await prisma.tenant.findFirst({
            where: {
                id: tenantId,
                ativo: true,
            },
        });

        if (!tenant) {
            throw new NotFoundError("Tenant não encontrado ou inativo");
        }

        // Se já existe um token, revogar primeiro
        const tenantWithToken = tenant as { apiTokenId?: string | null; apiTokenHash?: string | null };
        if (tenantWithToken.apiTokenId && tenantWithToken.apiTokenHash) {
            await this.revoke(tenantId);
        }

        // Gerar ID único para o token (parte pública)
        const tokenId = `api_${crypto.randomUUID().replace(/-/g, "")}`;

        // Gerar secret aleatório (parte privada)
        const secret = crypto.randomBytes(32).toString("base64url");

        // Token completo: api_<tokenId>.<secret>
        const fullToken = `${tokenId}.${secret}`;

        // Hash do token completo para armazenar no banco
        const tokenHash = await bcrypt.hash(fullToken, 10);

        // Atualizar tenant com o token
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                apiTokenId: tokenId,
                apiTokenHash: tokenHash,
            } as any,
        });

        // Log apenas do tokenId (não do secret)
        console.log(`[IntegrationToken] Token gerado para tenant ${tenantId}: ${tokenId}...`);

        return fullToken;
    }

    /**
     * Revoga o token de integração de um tenant
     */
    async revoke(tenantId: string): Promise<void> {
        const tenant = await prisma.tenant.findFirst({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundError("Tenant não encontrado");
        }

        const tenantWithToken = tenant as any;
        if (!tenantWithToken.apiTokenId || !tenantWithToken.apiTokenHash) {
            throw new ValidationError("Token de integração não existe para este tenant");
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                apiTokenId: null,
                apiTokenHash: null,
            } as any,
        });

        console.log(`[IntegrationToken] Token revogado para tenant ${tenantId}`);
    }

    /**
     * Valida um token de integração e retorna o tenant associado
     */
    async validate(token: string): Promise<{ tenantId: string; tenant: any }> {
        if (!token || !token.startsWith("api_")) {
            throw new ValidationError("Token de integração inválido");
        }

        // Extrair tokenId (parte antes do ponto)
        const parts = token.split(".");
        if (parts.length !== 2) {
            throw new ValidationError("Formato de token inválido");
        }

        const tokenId = parts[0]; // api_<uuid>

        // Buscar tenant pelo tokenId
        const tenant = await prisma.tenant.findFirst({
            where: {
                apiTokenId: tokenId,
                ativo: true,
            } as any,
        });

        const tenantWithToken = tenant as { apiTokenHash?: string | null };
        if (!tenant || !tenantWithToken.apiTokenHash) {
            throw new ValidationError("Token de integração inválido ou tenant inativo");
        }

        // Verificar se o token completo corresponde ao hash
        const isValid = await bcrypt.compare(token, tenantWithToken.apiTokenHash);

        if (!isValid) {
            throw new ValidationError("Token de integração inválido");
        }

        return {
            tenantId: tenant.id,
            tenant: {
                id: tenant.id,
                nome: tenant.nome,
                slug: tenant.slug,
                ativo: tenant.ativo,
            },
        };
    }
}

