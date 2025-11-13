import type { FastifyRequest, FastifyReply } from "fastify";
import { CobrancaService } from "../services/cobranca.service";
import {
  createCobrancaSchema,
  updateCobrancaSchema,
  listCobrancasQuerySchema,
} from "../types/cobranca";
import { sendValidationError, isZodError } from "../utils/zod-error-handler";

const cobrancaService = new CobrancaService();

export class CobrancaController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const body = createCobrancaSchema.parse(request.body);

      const cobranca = await cobrancaService.create(body, request.tenantId!);

      return reply.status(201).send({
        success: true,
        data: cobranca,
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
      // tenantId já está disponível via middleware de autenticação
      const query = listCobrancasQuerySchema.parse(request.query);

      const result = await cobrancaService.list(query, request.tenantId!);

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
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };

      const cobranca = await cobrancaService.findById(id, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cobranca,
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
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };
      const body = updateCobrancaSchema.parse(request.body);

      const cobranca = await cobrancaService.update(id, body, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cobranca,
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

  async marcarComoPago(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };

      const cobranca = await cobrancaService.marcarComoPago(
        id,
        request.tenantId!,
      );

      return reply.status(200).send({
        success: true,
        data: cobranca,
        message: "Cobrança marcada como paga",
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

  async vencendoHoje(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const cobrancas = await cobrancaService.vencendoHoje(request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cobrancas,
        count: cobrancas.length,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: "Erro ao buscar cobranças vencendo hoje",
      });
    }
  }

  async atrasadas(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const cobrancas = await cobrancaService.atrasadas(request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cobrancas,
        count: cobrancas.length,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: "Erro ao buscar cobranças atrasadas",
      });
    }
  }

  async resumoPorSituacao(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const resumo = await cobrancaService.resumoPorSituacao(request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: resumo,
        counts: {
          aVencer: resumo.aVencer.length,
          venceHoje: resumo.venceHoje.length,
          atrasado: resumo.atrasado.length,
        },
      });
    } catch (error) {
      console.error("[CobrancaController] Erro ao buscar resumo:", error);
      return reply.status(500).send({
        success: false,
        error: "Erro ao buscar resumo de cobranças",
      });
    }
  }
}

