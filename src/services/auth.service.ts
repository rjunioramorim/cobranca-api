import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import type { LoginInput, RegisterInput } from "../types/auth";
import { UnauthorizedError, NotFoundError, ConflictError } from "../utils/errors";

export class AuthService {
  async login(data: LoginInput) {
    // Buscar usuário por email (sem filtro de tenant primeiro)
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        ativo: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Email ou senha inválidos");
    }

    // Verificar se o tenant está ativo (apenas se usuário tiver tenant)
    if (user.tenant && !user.tenant.ativo) {
      throw new UnauthorizedError("Tenant inativo");
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(data.senha, user.senha);

    if (!senhaValida) {
      throw new UnauthorizedError("Email ou senha inválidos");
    }

    // Retornar dados do usuário (sem senha)
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      tenantId: user.tenantId,
      isAdmin: user.isAdmin,
      tenant: user.tenant ? {
        id: user.tenant.id,
        nome: user.tenant.nome,
        slug: user.tenant.slug,
      } : null,
    };
  }

  async register(data: RegisterInput) {
    // Verificar se o tenant existe e está ativo
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: data.tenantId,
        ativo: true,
      },
    });

    if (!tenant) {
      throw new NotFoundError("Tenant não encontrado ou inativo");
    }

    // Verificar se já existe usuário com mesmo email no tenant
    const usuarioExistente = await prisma.user.findFirst({
      where: {
        tenantId: data.tenantId,
        email: data.email,
      },
    });

    if (usuarioExistente) {
      throw new ConflictError("Já existe um usuário com este email neste tenant");
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(data.senha, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        senha: senhaHash,
        nome: data.nome,
        role: data.role || "USER",
      },
      include: {
        tenant: true,
      },
    });

    // Retornar dados do usuário (sem senha)
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      tenantId: user.tenantId,
      tenant: {
        id: user.tenant.id,
        nome: user.tenant.nome,
        slug: user.tenant.slug,
      },
    };
  }

  async generateToken(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
  }) {
    // O token será gerado pelo Fastify JWT
    // Este método retorna os dados que serão incluídos no token
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || null, // null para admin total
    };
  }

  /**
   * Gera um refresh token e salva no banco de dados
   */
  async generateRefreshToken(userId: string): Promise<string> {
    // Limpar tokens expirados do usuário
    await this.cleanExpiredTokens(userId);

    // Gerar token aleatório seguro
    const token = crypto.randomBytes(64).toString("hex");

    // Data de expiração: 30 dias a partir de agora
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Salvar no banco de dados
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Valida um refresh token e retorna os dados do usuário
   */
  async validateRefreshToken(token: string) {
    // Buscar o token no banco
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token inválido");
    }

    // Verificar se o token expirou
    if (refreshToken.expiresAt < new Date()) {
      // Remover token expirado
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      throw new UnauthorizedError("Refresh token expirado");
    }

    // Verificar se o usuário ainda está ativo
    if (!refreshToken.user.ativo) {
      // Remover todos os tokens do usuário inativo
      await this.revokeAllUserTokens(refreshToken.userId);
      throw new UnauthorizedError("Usuário inativo");
    }

    // Verificar se o tenant ainda está ativo (apenas se usuário tiver tenant)
    if (refreshToken.user.tenant && !refreshToken.user.tenant.ativo) {
      throw new UnauthorizedError("Tenant inativo");
    }

    return {
      id: refreshToken.user.id,
      email: refreshToken.user.email,
      nome: refreshToken.user.nome,
      role: refreshToken.user.role,
      tenantId: refreshToken.user.tenantId,
      isAdmin: refreshToken.user.isAdmin,
      tenant: refreshToken.user.tenant ? {
        id: refreshToken.user.tenant.id,
        nome: refreshToken.user.tenant.nome,
        slug: refreshToken.user.tenant.slug,
      } : null,
    };
  }

  /**
   * Revoga um refresh token específico
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Limpa tokens expirados de um usuário
   */
  async cleanExpiredTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Limpa todos os tokens expirados do banco (útil para cron job)
   */
  async cleanAllExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

