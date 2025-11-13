/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * Erro de validação de negócio (400)
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/**
 * Erro de autenticação (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Não autorizado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * Erro de permissão (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Acesso negado") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * Erro de conflito (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Erro interno do servidor (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Erro interno do servidor") {
    super(message, 500, "INTERNAL_SERVER_ERROR");
  }
}

/**
 * Verifica se o erro é uma instância de AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

