import type { FastifyRequest, FastifyReply } from "fastify";
import { IntegrationTokenService } from "../services/integration-token.service";

const integrationTokenService = new IntegrationTokenService();

/**
 * Middleware para validar token de integração via header X-API-Token
 * Apenas para o endpoint /api/cobrancas/resumo-situacao
 */
export async function integrationTokenMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Verificar se o header X-API-Token foi fornecido
    const apiToken = request.headers["x-api-token"] as string;

    if (!apiToken) {
      return reply.status(401).send({
        success: false,
        error: "Token de integração não fornecido. Forneça um token no header X-API-Token",
      });
    }

    // Validar token
    const { tenantId, tenant } = await integrationTokenService.validate(apiToken);

    // Popular request com dados do tenant
    request.tenantId = tenantId;
    request.tenant = tenant;
    request.isIntegrationToken = true;

    request.log.debug({ tenantId, tenantNome: tenant.nome }, "Token de integração validado");
  } catch (error: any) {
    request.log.error({ error: error.message }, "Erro ao validar token de integração");
    return reply.status(401).send({
      success: false,
      error: error.message || "Token de integração inválido",
    });
  }
}

