import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { integrationTokenMiddleware } from "./integration-token.middleware";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.info({ url: request.url }, "Iniciando middleware de autenticação");
  try {
    // Verificar se o token foi fornecido no header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      request.log.warn({ url: request.url }, "Token não fornecido no header Authorization");
      return reply.status(401).send({
        success: false,
        error: "Token não fornecido. Forneça um token no header Authorization",
      });
    }

    // Extrair o token do header
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      request.log.warn({ url: request.url }, "Token vazio após remover 'Bearer '");
      return reply.status(401).send({
        success: false,
        error: "Token não fornecido",
      });
    }

    // Log do token (apenas primeiros caracteres para debug)
    request.log.debug({ tokenPrefix: token.substring(0, 20) }, "Verificando token JWT");

    // Verificar se o token JWT foi fornecido
    try {
      await request.jwtVerify();
    } catch (jwtError: any) {
      request.log.error({
        error: jwtError.message,
        name: jwtError.name,
        code: jwtError.code
      }, "Erro ao verificar JWT");
      throw jwtError; // Re-lançar para ser capturado no catch externo
    }

    // Extrair dados do token
    // O jwtVerify() popula request.user com o payload do token (que tem userId, não id)
    request.log.debug({ user: request.user }, "Payload do token após jwtVerify");

    // O payload do token tem userId, não id
    // Precisamos fazer um cast para unknown primeiro para evitar erro de tipo
    const payload = request.user as unknown as {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
    } | null;

    // Verificar se o payload foi extraído corretamente
    if (!payload || !payload.userId) {
      request.log.error({
        payload,
        requestUser: request.user,
        hasUserId: !!payload?.userId
      }, "Payload do token inválido ou sem userId");
      return reply.status(401).send({
        success: false,
        error: "Token inválido: payload não contém userId",
      });
    }

    request.log.debug({ userId: payload.userId, tenantId: payload.tenantId }, "Payload extraído do token");

    // Buscar usuário no banco para garantir que ainda existe e está ativo
    // Para admin total, tenantId pode ser null no payload
    const whereClause: any = {
      id: payload.userId,
      ativo: true,
    };

    // Se não for admin total, verificar tenantId
    if (payload.tenantId) {
      whereClause.tenantId = payload.tenantId;
    } else {
      // Admin total não tem tenantId
      whereClause.tenantId = null;
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: "Usuário não encontrado ou inativo",
      });
    }

    // Verificar se tenant está ativo (apenas se usuário tiver tenant)
    if (user.tenant && !user.tenant.ativo) {
      return reply.status(401).send({
        success: false,
        error: "Tenant inativo",
      });
    }

    // Adicionar dados do usuário e tenant ao request
    request.userId = user.id;
    request.tenantId = user.tenantId || undefined; // undefined se for admin total
    request.user = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      tenantId: user.tenantId || undefined,
      isAdmin: user.isAdmin,
    };

    // Adicionar tenant ao request (apenas se existir)
    if (user.tenant) {
      request.tenant = {
        id: user.tenant.id,
        nome: user.tenant.nome,
        slug: user.tenant.slug,
        ativo: user.tenant.ativo,
      };
    }
  } catch (error: any) {
    // Log do erro para debug
    request.log.error({ error: error.message }, "Erro na autenticação");

    // Verificar o tipo de erro
    if (error.message?.includes("No Authorization")) {
      return reply.status(401).send({
        success: false,
        error: "Token não fornecido",
      });
    }

    if (error.message?.includes("expired")) {
      return reply.status(401).send({
        success: false,
        error: "Token expirado",
      });
    }

    if (error.message?.includes("invalid") || error.message?.includes("malformed")) {
      return reply.status(401).send({
        success: false,
        error: "Token inválido",
      });
    }

    return reply.status(401).send({
      success: false,
      error: "Token inválido ou expirado",
    });
  }
}

// Plugin do Fastify para registrar o middleware de autenticação
export async function authPlugin(_instance: FastifyInstance) {
  // JWT já foi registrado no index.ts antes deste plugin
  // Este plugin não faz nada, apenas marca que o JWT foi configurado
  // O hook será registrado diretamente no app principal no index.ts
}

// Função para registrar o hook de autenticação diretamente no app
export function registerAuthHook(app: FastifyInstance) {
  // Log para confirmar que a função está sendo chamada
  app.log.info("Registrando hook de autenticação diretamente no app");

  // Aplicar middleware em todas as rotas exceto rotas públicas
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    // Log para debug - verificar se o hook está sendo chamado
    app.log.info({ url: request.url, method: request.method }, "Hook de autenticação chamado");

    // Permitir POST /api/tenants (criar tenant) sem autenticação
    if (request.url === "/api/tenants" && request.method === "POST") {
      return; // Permitir criar tenant sem autenticação
    }

    // Rotas públicas (não requerem autenticação)
    const publicRoutes = [
      "/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/refresh",
      "/api/auth/logout",
    ];

    const isPublicRoute = publicRoutes.some((route) =>
      request.url.startsWith(route),
    );

    if (!isPublicRoute) {
      const apiToken = request.headers["x-api-token"] as string;
      
      // Verificar se é um endpoint que aceita token de integração
      const isResumoEndpoint = request.url === "/api/cobrancas/resumo-situacao" && request.method === "GET";
      const isMensagemCreateEndpoint = request.url === "/api/mensagens" && request.method === "POST";
      const isMensagemUpdateEndpoint = 
        request.url?.startsWith("/api/mensagens/") && 
        (request.method === "PUT" || request.method === "PATCH");
      
      if ((isResumoEndpoint || isMensagemCreateEndpoint || isMensagemUpdateEndpoint) && apiToken) {
        // Usar token de integração
        request.log.info({ url: request.url, method: request.method }, "Usando token de integração");
        await integrationTokenMiddleware(request, reply);

        if (reply.sent) {
          return;
        }
      } else if (isResumoEndpoint || isMensagemCreateEndpoint || isMensagemUpdateEndpoint) {
        // Usar autenticação JWT normal para endpoints que aceitam ambos
        request.log.info({ url: request.url, method: request.method }, "Usando autenticação JWT");
        await authMiddleware(request, reply);

        if (reply.sent) {
          return;
        }
      } else {
        // Para outras rotas, usar autenticação JWT normal
        request.log.info({ url: request.url, method: request.method }, "Executando middleware de autenticação");
        await authMiddleware(request, reply);

        // Verificar se a resposta já foi enviada (erro 401)
        if (reply.sent) {
          request.log.debug({ url: request.url }, "Resposta enviada pelo middleware (erro de autenticação)");
          return;
        }

        // Verificar se o usuário foi populado
        if (!request.user || !request.userId) {
          request.log.warn({
            url: request.url,
            hasUser: !!request.user,
            hasUserId: !!request.userId
          }, "Middleware executado mas usuário não foi populado");
        }
      }
    }
  });
}

