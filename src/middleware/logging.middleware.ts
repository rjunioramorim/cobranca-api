import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config/env";

/**
 * Plugin para logging estruturado de requisições e respostas
 */
export async function loggingPlugin(instance: FastifyInstance) {
  // Hook para logar requisições recebidas
  instance.addHook("onRequest", async (request: FastifyRequest) => {
    // Adicionar timestamp de início da requisição
    request.requestStartTime = Date.now();

    // Log da requisição recebida
    const requestLog = {
      type: "request",
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      ...(request.userId && { userId: request.userId }),
      ...(request.tenantId && { tenantId: request.tenantId }),
    };

    request.log.info(requestLog, "Requisição recebida");
  });

  // Hook para logar respostas enviadas
  instance.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    // Calcular tempo de resposta
    const responseTime = request.requestStartTime
      ? Date.now() - request.requestStartTime
      : 0;

    // Log da resposta enviada
    const responseLog = {
      type: "response",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: `${responseTime}ms`,
      responseTimeMs: responseTime,
      ip: request.ip,
      ...(request.userId && { userId: request.userId }),
      ...(request.tenantId && { tenantId: request.tenantId }),
    };

    // Log com nível apropriado baseado no status code
    if (reply.statusCode >= 500) {
      request.log.error(responseLog, "Erro na resposta");
    } else if (reply.statusCode >= 400) {
      request.log.warn(responseLog, "Resposta com erro");
    } else {
      request.log.info(responseLog, "Resposta enviada");
    }
  });

  // Hook para logar erros (complementa o error handler)
  instance.addHook("onError", async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const errorLog = {
      type: "error",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode || 500,
      error: error.message,
      errorName: error.name,
      ip: request.ip,
      ...(request.userId && { userId: request.userId }),
      ...(request.tenantId && { tenantId: request.tenantId }),
      ...(config.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    };

    request.log.error(errorLog, "Erro na requisição");
  });
}

// Tipos estão definidos em types/fastify.d.ts

