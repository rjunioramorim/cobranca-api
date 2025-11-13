import { prisma } from "../lib/prisma";
import type { CreateTenantInput, UpdateTenantInput, ListTenantsQuery } from "../types/tenant";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors";
import bcrypt from "bcryptjs";

export class TenantService {
  async create(data: CreateTenantInput) {
    // Verificar se já existe tenant com mesmo slug
    const tenantExistente = await prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (tenantExistente) {
      throw new ConflictError("Já existe um tenant com este slug");
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        nome: data.nome,
        slug: data.slug.toLowerCase(),
        config: data.config || {},
      },
    });

    // Se foram fornecidos dados do admin, criar usuário admin para o tenant
    if (data.adminEmail && data.adminSenha && data.adminNome) {
      // Verificar se já existe usuário com mesmo email no tenant
      const usuarioExistente = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: data.adminEmail,
        },
      });

      if (usuarioExistente) {
        // Se o tenant foi criado mas o usuário já existe, remover o tenant
        await prisma.tenant.delete({ where: { id: tenant.id } });
        throw new ConflictError("Já existe um usuário com este email neste tenant");
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(data.adminSenha, 10);

      // Criar usuário admin
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          senha: senhaHash,
          nome: data.adminNome,
          role: "ADMIN",
          ativo: true,
        },
      });
    }

    return tenant;
  }

  async list(query: ListTenantsQuery) {
    const { ativo, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: {
      ativo?: boolean;
      OR?: Array<{ nome: { contains: string } } | { slug: { contains: string } }>;
    } = {};

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clientes: true,
            cobrancas: true,
            configuracoes: true,
          },
        },
        users: {
          where: {
            role: "ADMIN",
          },
          select: {
            id: true,
            email: true,
            nome: true,
            role: true,
            ativo: true,
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError("Tenant não encontrado");
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            clientes: true,
            cobrancas: true,
            configuracoes: true,
          },
        },
      },
    });

        if (!tenant) {
            throw new NotFoundError("Tenant não encontrado");
        }

    return tenant;
  }

  async update(id: string, data: UpdateTenantInput) {
    // Verificar se tenant existe
    const tenantExistente = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenantExistente) {
      throw new NotFoundError("Tenant não encontrado");
    }

    // Se está atualizando slug, verificar se não existe outro tenant com mesmo slug
    if (data.slug && data.slug.toLowerCase() !== tenantExistente.slug) {
      const slugExistente = await prisma.tenant.findUnique({
        where: { slug: data.slug.toLowerCase() },
      });

      if (slugExistente) {
        throw new ConflictError("Já existe um tenant com este slug");
      }
    }

    const updateData: { nome?: string; slug?: string; ativo?: boolean; config?: unknown } = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.slug !== undefined) updateData.slug = data.slug.toLowerCase();
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.config !== undefined) updateData.config = data.config;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // Se foram fornecidos dados do admin, criar ou atualizar usuário admin
    if (data.adminEmail && data.adminSenha && data.adminNome) {
      // Buscar usuário admin existente
      const adminExistente = await prisma.user.findFirst({
        where: {
          tenantId: id,
          role: "ADMIN",
        },
      });

      // Verificar se já existe outro usuário com o mesmo email
      const emailExistente = await prisma.user.findFirst({
        where: {
          tenantId: id,
          email: data.adminEmail,
          id: adminExistente ? { not: adminExistente.id } : undefined,
        },
      });

      if (emailExistente) {
        throw new ConflictError("Já existe um usuário com este email neste tenant");
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(data.adminSenha, 10);

      if (adminExistente) {
        // Atualizar usuário admin existente
        await prisma.user.update({
          where: { id: adminExistente.id },
          data: {
            email: data.adminEmail,
            senha: senhaHash,
            nome: data.adminNome,
          },
        });
      } else {
        // Criar novo usuário admin
        await prisma.user.create({
          data: {
            tenantId: id,
            email: data.adminEmail,
            senha: senhaHash,
            nome: data.adminNome,
            role: "ADMIN",
            ativo: true,
          },
        });
      }
    }

    return tenant;
  }

  async deactivate(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

        if (!tenant) {
            throw new NotFoundError("Tenant não encontrado");
        }

    if (!tenant.ativo) {
      throw new ValidationError("Tenant já está desativado");
    }

    const tenantAtualizado = await prisma.tenant.update({
      where: { id },
      data: { ativo: false },
    });

    return tenantAtualizado;
  }

  async activate(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

        if (!tenant) {
            throw new NotFoundError("Tenant não encontrado");
        }

    if (tenant.ativo) {
      throw new ValidationError("Tenant já está ativo");
    }

    const tenantAtualizado = await prisma.tenant.update({
      where: { id },
      data: { ativo: true },
    });

    return tenantAtualizado;
  }
}

