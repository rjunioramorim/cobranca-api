import type { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema, refreshTokenSchema } from "../types/auth";
import { prisma } from "../lib/prisma";
import { sendValidationError, isZodError } from "../utils/zod-error-handler";

const authService = new AuthService();

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);

      const user = await authService.login(body);

      // Gerar access token JWT
      const tokenPayload = await authService.generateToken(user);
      const accessToken = request.server.jwt.sign(tokenPayload);

      // Gerar refresh token
      const refreshToken = await authService.generateRefreshToken(user.id);

      return reply.status(200).send({
        success: true,
        data: {
          token: accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
            tenantId: user.tenantId,
            isAdmin: user.isAdmin,
          },
          tenant: user.tenant,
        },
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

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);

      const user = await authService.register(body);

      // Gerar access token JWT
      const tokenPayload = await authService.generateToken(user);
      const accessToken = request.server.jwt.sign(tokenPayload);

      // Gerar refresh token
      const refreshToken = await authService.generateRefreshToken(user.id);

      return reply.status(201).send({
        success: true,
        data: {
          token: accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
          },
          tenant: user.tenant,
        },
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

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Dados do usuário já estão no request (via middleware)
      // O middleware de autenticação já verificou o token e populou request.user
      if (!request.user || !request.userId) {
        request.log.warn({ 
          hasUser: !!request.user, 
          hasUserId: !!request.userId,
          url: request.url 
        }, "Usuário não autenticado no controller me");
        return reply.status(401).send({
          success: false,
          error: "Usuário não autenticado",
        });
      }

      // Buscar dados completos do usuário
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          email: true,
          nome: true,
          role: true,
          tenantId: true,
          isAdmin: true,
          tenant: {
            select: {
              id: true,
              nome: true,
              slug: true,
            },
          },
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      return reply.status(200).send({
        success: true,
        data: user,
      });
    } catch (error) {
      // Re-lançar para o error handler global
      throw error;
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = refreshTokenSchema.parse(request.body);

      // Validar refresh token e obter dados do usuário
      const user = await authService.validateRefreshToken(body.refreshToken);

      // Gerar novo access token
      const tokenPayload = await authService.generateToken(user);
      const accessToken = request.server.jwt.sign(tokenPayload);

      // Opcional: gerar novo refresh token (rotacionar)
      // Por segurança, podemos revogar o antigo e gerar um novo
      await authService.revokeRefreshToken(body.refreshToken);
      const newRefreshToken = await authService.generateRefreshToken(user.id);

      return reply.status(200).send({
        success: true,
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
            tenantId: user.tenantId,
            isAdmin: user.isAdmin,
          },
          tenant: user.tenant,
        },
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

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Se houver refresh token no body, revogá-lo
      const body = request.body as { refreshToken?: string };
      
      if (body?.refreshToken) {
        await authService.revokeRefreshToken(body.refreshToken);
      }

      return reply.status(200).send({
        success: true,
        message: "Logout realizado com sucesso",
      });
    } catch (error) {
      // Re-lançar para o error handler global
      throw error;
    }
  }
}

