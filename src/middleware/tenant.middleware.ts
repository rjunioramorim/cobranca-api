import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function tenantMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    // Obter tenant do header (X-Tenant-Id ou X-Tenant-Slug)
    const tenantId = request.headers["x-tenant-id"] as string | undefined;
    const tenantSlug = request.headers["x-tenant-slug"] as string | undefined;

    // Se não forneceu nenhum identificador, retornar erro
    if (!tenantId && !tenantSlug) {
        return reply.status(401).send({
            success: false,
            error: "Tenant não identificado. Forneça X-Tenant-Id ou X-Tenant-Slug no header",
        });
    }

    try {
        // Buscar tenant por ID ou slug
        const tenant = await prisma.tenant.findFirst({
            where: tenantId
                ? { id: tenantId, ativo: true }
                : { slug: tenantSlug, ativo: true },
        });

        if (!tenant) {
            return reply.status(404).send({
                success: false,
                error: "Tenant não encontrado ou inativo",
            });
        }

        // Adicionar tenant ao request
        request.tenantId = tenant.id;
        request.tenant = {
            id: tenant.id,
            nome: tenant.nome,
            slug: tenant.slug,
            ativo: tenant.ativo,
        };
    } catch (error) {
        request.log.error(error, "Erro ao buscar tenant");
        return reply.status(500).send({
            success: false,
            error: "Erro ao identificar tenant",
        });
    }
}

// Plugin do Fastify para registrar o middleware
export async function tenantPlugin(instance: FastifyInstance) {
    // Aplicar middleware em todas as rotas exceto /health e rotas de tenant
    instance.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
        // Pular middleware para rotas públicas
        const publicRoutes = ["/health", "/api/tenants"];
        const isPublicRoute = publicRoutes.some((route) =>
            request.url.startsWith(route),
        );

        if (!isPublicRoute) {
            await tenantMiddleware(request, reply);
        }
    });
}

