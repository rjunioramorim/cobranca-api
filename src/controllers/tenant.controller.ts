import type { FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../services/tenant.service";
import {
  createTenantSchema,
  updateTenantSchema,
  listTenantsQuerySchema,
} from "../types/tenant";
import { sendValidationError, isZodError } from "../utils/zod-error-handler";

const tenantService = new TenantService();

export class TenantController {
  async adminList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem listar todos os tenants.",
        });
      }

      const query = listTenantsQuerySchema.parse(request.query);
      const result = await tenantService.list(query);

      return reply.status(200).send({
        success: true,
        ...result,
      });
    } catch (error) {
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      throw error;
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem criar tenants.",
        });
      }

      const body = createTenantSchema.parse(request.body);

      const tenant = await tenantService.create(body);

      return reply.status(201).send({
        success: true,
        data: tenant,
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listTenantsQuerySchema.parse(request.query);

      const result = await tenantService.list(query);

      return reply.status(200).send({
        success: true,
        ...result,
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem visualizar tenants.",
        });
      }

      const { id } = request.params as { id: string };

      const tenant = await tenantService.findById(id);

      return reply.status(200).send({
        success: true,
        data: tenant,
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async findBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };

      const tenant = await tenantService.findBySlug(slug);

      return reply.status(200).send({
        success: true,
        data: tenant,
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem atualizar tenants.",
        });
      }

      const { id } = request.params as { id: string };
      const body = updateTenantSchema.parse(request.body);

      const tenant = await tenantService.update(id, body);

      return reply.status(200).send({
        success: true,
        data: tenant,
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async deactivate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem desativar tenants.",
        });
      }

      const { id } = request.params as { id: string };

      const tenant = await tenantService.deactivate(id);

      return reply.status(200).send({
        success: true,
        data: tenant,
        message: "Tenant desativado com sucesso",
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }

  async activate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { isAdmin?: boolean } | undefined;
      if (!user?.isAdmin) {
        return reply.status(403).send({
          success: false,
          error: "Acesso negado. Apenas administradores totais podem ativar tenants.",
        });
      }

      const { id } = request.params as { id: string };

      const tenant = await tenantService.activate(id);

      return reply.status(200).send({
        success: true,
        data: tenant,
        message: "Tenant reativado com sucesso",
      });
    } catch (error) {
      // Erro de validação Zod
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      // Re-lançar para o error handler global
      throw error;
    }
  }
}
