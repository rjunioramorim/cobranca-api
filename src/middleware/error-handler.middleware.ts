import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { formatZodError, isZodError } from "../utils/zod-error-handler";
import { isAppError, AppError } from "../utils/errors";
import { config } from "../config/env";

/**
 * Plugin para tratamento global de erros
 */
export async function errorHandlerPlugin(instance: FastifyInstance) {
  // Handler global de erros
  instance.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      // Log estruturado do erro
      const errorLog = {
        error: error.message,
        stack: error.stack,
        name: error.name,
        url: request.url,
        method: request.method,
        statusCode: 500,
        userId: request.userId,
        tenantId: request.tenantId,
      };

      // Erro de validação Zod
      if (isZodError(error)) {
        const formatted = formatZodError(error);
        errorLog.statusCode = 400;
        request.log.warn({ ...errorLog, details: formatted.errors }, "Erro de validação");
        
        return reply.status(400).send({
          success: false,
          error: formatted.message,
          details: formatted.errors,
        });
      }

      // Erro customizado da aplicação (AppError)
      if (isAppError(error)) {
        errorLog.statusCode = error.statusCode;
        
        if (error.statusCode >= 500) {
          request.log.error(errorLog, "Erro interno");
        } else {
          request.log.warn(errorLog, "Erro de negócio");
        }

        return reply.status(error.statusCode).send({
          success: false,
          error: error.message,
          ...(error.code && { code: error.code }),
        });
      }

      // Erro do Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        errorLog.statusCode = 400;
        request.log.warn(errorLog, "Erro do Prisma");

        // Erro de registro único duplicado
        if (error.code === "P2002") {
          const field = error.meta?.target as string[] | undefined;
          const fieldName = field?.[0] || "campo";
          return reply.status(409).send({
            success: false,
            error: `Já existe um registro com este ${fieldName}`,
            code: "DUPLICATE_ENTRY",
          });
        }

        // Erro de registro não encontrado
        if (error.code === "P2025") {
          return reply.status(404).send({
            success: false,
            error: "Registro não encontrado",
            code: "NOT_FOUND",
          });
        }

        // Erro de violação de foreign key
        if (error.code === "P2003") {
          return reply.status(400).send({
            success: false,
            error: "Referência inválida",
            code: "FOREIGN_KEY_CONSTRAINT",
          });
        }

        // Outros erros do Prisma
        return reply.status(400).send({
          success: false,
          error: "Erro ao processar requisição",
          code: "DATABASE_ERROR",
          ...(config.NODE_ENV === "development" && {
            details: error.message,
          }),
        });
      }

      // Erro de validação do Prisma
      if (error instanceof Prisma.PrismaClientValidationError) {
        errorLog.statusCode = 400;
        request.log.warn(errorLog, "Erro de validação do Prisma");

        return reply.status(400).send({
          success: false,
          error: "Dados inválidos",
          code: "VALIDATION_ERROR",
          ...(config.NODE_ENV === "development" && {
            details: error.message,
          }),
        });
      }

      // Erro de negócio (Error comum) - tentar classificar pela mensagem
      if (error instanceof Error) {
        // Erros de autenticação
        if (
          error.message.includes("Token") ||
          error.message.includes("autenticado") ||
          error.message.includes("não encontrado ou inativo")
        ) {
          errorLog.statusCode = 401;
          request.log.warn(errorLog, "Erro de autenticação");
          
          return reply.status(401).send({
            success: false,
            error: error.message,
            code: "UNAUTHORIZED",
          });
        }

        // Erros de não encontrado
        if (error.message.includes("não encontrado")) {
          errorLog.statusCode = 404;
          request.log.warn(errorLog, "Recurso não encontrado");
          
          return reply.status(404).send({
            success: false,
            error: error.message,
            code: "NOT_FOUND",
          });
        }

        // Erros de validação de negócio
        if (
          error.message.includes("já existe") ||
          error.message.includes("inválido") ||
          error.message.includes("obrigatório")
        ) {
          errorLog.statusCode = 400;
          request.log.warn(errorLog, "Erro de validação");
          
          return reply.status(400).send({
            success: false,
            error: error.message,
            code: "VALIDATION_ERROR",
          });
        }

        // Outros erros de negócio
        errorLog.statusCode = 400;
        request.log.warn(errorLog, "Erro de negócio");
        
        return reply.status(400).send({
          success: false,
          error: error.message,
        });
      }

      // Erro desconhecido
      request.log.error(errorLog, "Erro desconhecido");
      
      return reply.status(500).send({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_SERVER_ERROR",
        ...(config.NODE_ENV === "development" && {
          details: error.message,
          stack: error.stack,
        }),
      });
    },
  );

  // Handler para rotas não encontradas
  instance.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    request.log.warn(
      {
        url: request.url,
        method: request.method,
      },
      "Rota não encontrada",
    );

    return reply.status(404).send({
      success: false,
      error: "Rota não encontrada",
      code: "NOT_FOUND",
      path: request.url,
    });
  });
}

