import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { IntegrationTokenService } from "../services/integration-token.service";
import { NotFoundError, ValidationError } from "../utils/errors";

const integrationTokenService = new IntegrationTokenService();

// Schema para validar body da requisição
const generateTokenSchema = z.object({
    tenantId: z.string().uuid("ID do tenant inválido").optional(),
});

export class IntegrationController {
    /**
     * Gera um token de integração
     * - Admin total (isAdmin = true): pode gerar para qualquer tenant (tenantId no body)
     * - Admin tenant: gera para seu próprio tenant
     */
    async generateToken(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Verificar se o usuário é admin total
            const user = request.user as { isAdmin?: boolean; tenantId?: string } | undefined;
            if (!user?.isAdmin) {
                return reply.status(403).send({
                    success: false,
                    error: "Acesso negado. Apenas administradores totais podem gerar tokens de integração",
                });
            }

            // Admin total pode especificar tenantId no body, caso contrário usa o tenantId do request
            const body = generateTokenSchema.parse(request.body || {});
            const tenantId = body.tenantId || request.tenantId;

            if (!tenantId) {
                return reply.status(400).send({
                    success: false,
                    error: "tenantId é obrigatório. Admin total deve fornecer tenantId no body da requisição.",
                });
            }

            // Gerar token
            const token = await integrationTokenService.generate(tenantId);

            return reply.status(200).send({
                success: true,
                data: {
                    token,
                    message: "Token de integração gerado com sucesso. Guarde este token em local seguro, pois ele não será exibido novamente.",
                },
            });
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) {
                return reply.status(400).send({
                    success: false,
                    error: error.message,
                });
            }

            console.error("[IntegrationController] Erro ao gerar token:", error);
            return reply.status(500).send({
                success: false,
                error: "Erro ao gerar token de integração",
            });
        }
    }

    /**
     * Revoga o token de integração
     * - Admin total (isAdmin = true): pode revogar de qualquer tenant (tenantId no body)
     * - Admin tenant: revoga do seu próprio tenant
     */
    async revokeToken(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Verificar se o usuário é admin total
            const user = request.user as { isAdmin?: boolean; tenantId?: string } | undefined;
            if (!user?.isAdmin) {
                return reply.status(403).send({
                    success: false,
                    error: "Acesso negado. Apenas administradores totais podem revogar tokens de integração",
                });
            }

            // Admin total pode especificar tenantId no body, caso contrário usa o tenantId do request
            const body = generateTokenSchema.parse(request.body || {});
            const tenantId = body.tenantId || request.tenantId;

            if (!tenantId) {
                return reply.status(400).send({
                    success: false,
                    error: "tenantId é obrigatório. Admin total deve fornecer tenantId no body da requisição.",
                });
            }

            // Revogar token
            await integrationTokenService.revoke(tenantId);

            return reply.status(200).send({
                success: true,
                message: "Token de integração revogado com sucesso",
            });
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) {
                return reply.status(400).send({
                    success: false,
                    error: error.message,
                });
            }

            console.error("[IntegrationController] Erro ao revogar token:", error);
            return reply.status(500).send({
                success: false,
                error: "Erro ao revogar token de integração",
            });
        }
    }
}

