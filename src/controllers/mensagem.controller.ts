import type { FastifyRequest, FastifyReply } from "fastify";
import { MensagemService } from "../services/mensagem.service";
import { listMensagensQuerySchema, updateMensagemSchema, createMensagemSchema } from "../types/mensagem";
import { sendValidationError, isZodError } from "../utils/zod-error-handler";

const mensagemService = new MensagemService();

export class MensagemController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          success: false,
          error: "Tenant não identificado",
        });
      }

      const query = listMensagensQuerySchema.parse(request.query);
      const result = await mensagemService.list(request.tenantId, query);

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

  async findById(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          success: false,
          error: "Tenant não identificado",
        });
      }

      const { id } = request.params as { id: string };

      const mensagem = await mensagemService.findById(id, request.tenantId);

      return reply.status(200).send({
        success: true,
        data: mensagem,
      });
    } catch (error: any) {
      if (error.message === "Mensagem não encontrada") {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          success: false,
          error: "Tenant não identificado",
        });
      }

      const { id } = request.params as { id: string };
      const body = updateMensagemSchema.parse(request.body || {});

      const mensagem = await mensagemService.update(id, request.tenantId, body);

      return reply.status(200).send({
        success: true,
        data: mensagem,
        message: "Mensagem atualizada com sucesso",
      });
    } catch (error: any) {
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      if (error.message === "Mensagem não encontrada") {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          success: false,
          error: "Tenant não identificado",
        });
      }

      const body = createMensagemSchema.parse(request.body || {});

      const mensagem = await mensagemService.create(body, request.tenantId);

      // Garantir que a resposta seja serializável
      const response = {
        success: true,
        data: {
          id: mensagem.id,
          tenantId: mensagem.tenantId,
          cobrancaId: mensagem.cobrancaId,
          clienteId: mensagem.clienteId,
          telefone: mensagem.telefone,
          mensagem: mensagem.mensagem,
          status: mensagem.status,
          dataAgendamento: mensagem.dataAgendamento,
          dataEnvio: mensagem.dataEnvio,
          erro: mensagem.erro,
          tentativas: mensagem.tentativas,
          createdAt: mensagem.createdAt,
          updatedAt: mensagem.updatedAt,
          cliente: mensagem.cliente || null,
          cobranca: mensagem.cobranca || null,
        },
        message: "Mensagem criada com sucesso",
      };

      return reply.status(201).send(response);
    } catch (error: any) {
      request.log.error({ error: error.message, stack: error.stack }, "Erro ao criar mensagem");
      
      if (isZodError(error)) {
        return sendValidationError(reply, error);
      }

      if (error.message === "Cliente não encontrado ou inativo" || 
          error.message === "Cobrança não encontrada ou não pertence ao cliente informado") {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  }
}

