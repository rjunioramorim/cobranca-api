import { ZodError } from "zod";
import type { FastifyReply } from "fastify";

/**
 * Formata erros do Zod em uma estrutura legível
 */
export function formatZodError(error: ZodError) {
  // Garantir que error.errors existe e é um array
  if (!error || !error.errors || !Array.isArray(error.errors)) {
    return {
      message: "Erro de validação",
      errors: [
        {
          field: "unknown",
          message: error?.message || "Erro de validação desconhecido",
          code: "CUSTOM",
        },
      ],
    };
  }

  const errors = error.errors.map((err) => ({
    field: (err.path && Array.isArray(err.path) ? err.path.join(".") : "unknown"),
    message: err.message || "Erro de validação",
    code: err.code || "CUSTOM",
  }));

  return {
    message: "Erro de validação",
    errors,
  };
}

/**
 * Retorna resposta de erro de validação formatada
 */
export function sendValidationError(reply: FastifyReply, error: ZodError) {
  const formatted = formatZodError(error);
  
  return reply.status(400).send({
    success: false,
    error: formatted.message,
    details: formatted.errors,
  });
}

/**
 * Verifica se o erro é um ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

