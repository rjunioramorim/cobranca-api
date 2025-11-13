import type { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    tenantId?: string;
    requestStartTime?: number;
    isIntegrationToken?: boolean; // Flag para identificar se a requisição usa token de integração
    // request.user pode ser o payload do token (após jwtVerify) ou o objeto do usuário (após buscar no banco)
    user?: {
      id?: string;
      userId?: string; // Payload do token tem userId
      email?: string;
      nome?: string;
      role?: string;
      tenantId?: string;
      isAdmin?: boolean; // Flag para identificar administrador total
    };
    tenant?: {
      id: string;
      nome: string;
      slug: string;
      ativo: boolean;
    };
  }
}

