import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { ClienteService } from "../services/cliente.service";
import {
    createClienteSchema,
    updateClienteSchema,
    listClientesQuerySchema,
} from "../types/cliente";
import { sendValidationError, isZodError } from "../utils/zod-error-handler";

const clienteService = new ClienteService();

export class ClienteController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const body = createClienteSchema.parse(request.body);

      const cliente = await clienteService.create(body, request.tenantId!);

      return reply.status(201).send({
        success: true,
        data: cliente,
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
      const query = listClientesQuerySchema.parse(request.query);

      const result = await clienteService.list(query, request.tenantId!);

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

      const cliente = await clienteService.findById(id, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cliente,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Cliente não encontrado") {
          return reply.status(404).send({
            success: false,
            error: error.message,
          });
        }

        return reply.status(400).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: "Erro ao buscar cliente",
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };
      const body = updateClienteSchema.parse(request.body);

      const cliente = await clienteService.update(id, body, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cliente,
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
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };

      const cliente = await clienteService.deactivate(id, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cliente,
        message: "Cliente desativado com sucesso",
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
      // tenantId já está disponível via middleware de autenticação
      const { id } = request.params as { id: string };

      const cliente = await clienteService.activate(id, request.tenantId!);

      return reply.status(200).send({
        success: true,
        data: cliente,
        message: "Cliente reativado com sucesso",
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

