import { prisma } from "../lib/prisma";
import type { ListMensagensQuery, UpdateMensagemInput, CreateMensagemInput } from "../types/mensagem";
import { NotFoundError, ValidationError } from "../utils/errors";

export class MensagemService {
  async list(tenantId: string, query: ListMensagensQuery) {
    const { status, clienteId, cobrancaId, search, page = 1, limit = 20, dataInicio, dataFim } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (cobrancaId) {
      where.cobrancaId = cobrancaId;
    }

    if (search) {
      where.OR = [
        { mensagem: { contains: search } },
        { telefone: { contains: search } },
        { cliente: { nome: { contains: search } } },
      ];
    }

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) {
        where.createdAt.gte = dataInicio;
      }
      if (dataFim) {
        where.createdAt.lte = dataFim;
      }
    }

    const [mensagens, total] = await Promise.all([
      prisma.mensagem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
          cobranca: {
            select: {
              id: true,
              valor: true,
              vencimento: true,
              status: true,
            },
          },
        },
      }),
      prisma.mensagem.count({ where }),
    ]);

    return {
      data: mensagens,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const mensagem = await prisma.mensagem.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        cobranca: {
          select: {
            id: true,
            valor: true,
            vencimento: true,
            status: true,
            pixCopiaECola: true,
          },
        },
      },
    });

    if (!mensagem) {
      throw new NotFoundError("Mensagem não encontrada");
    }

    return mensagem;
  }

  async update(id: string, tenantId: string, data: UpdateMensagemInput) {
    // Verificar se a mensagem existe e pertence ao tenant
    const mensagemExistente = await prisma.mensagem.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!mensagemExistente) {
      throw new NotFoundError("Mensagem não encontrada");
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.dataEnvio !== undefined) {
      updateData.dataEnvio = data.dataEnvio;
    }

    if (data.erro !== undefined) {
      updateData.erro = data.erro;
    }

    if (data.tentativas !== undefined) {
      updateData.tentativas = data.tentativas;
    }

    // Atualizar mensagem
    const mensagemAtualizada = await prisma.mensagem.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        cobranca: {
          select: {
            id: true,
            valor: true,
            vencimento: true,
            status: true,
          },
        },
      },
    });

    return mensagemAtualizada;
  }

  async create(data: CreateMensagemInput, tenantId: string) {
    // Verificar se o cliente existe e pertence ao tenant
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: data.clienteId,
        tenantId,
        ativo: true,
      },
    });

    if (!cliente) {
      throw new NotFoundError("Cliente não encontrado ou inativo");
    }

    // Se forneceu cobrancaId, verificar se existe e pertence ao tenant
    if (data.cobrancaId) {
      const cobranca = await prisma.cobranca.findFirst({
        where: {
          id: data.cobrancaId,
          tenantId,
          clienteId: data.clienteId, // Garantir que a cobrança pertence ao cliente
        },
      });

      if (!cobranca) {
        throw new ValidationError("Cobrança não encontrada ou não pertence ao cliente informado");
      }
    }

    // Criar mensagem
    const mensagem = await prisma.mensagem.create({
      data: {
        tenantId,
        cobrancaId: data.cobrancaId || null,
        clienteId: data.clienteId,
        telefone: data.telefone,
        mensagem: data.mensagem,
        status: data.status,
        dataAgendamento: data.dataAgendamento || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        cobranca: {
          select: {
            id: true,
            valor: true,
            vencimento: true,
            status: true,
          },
        },
      },
    });

    return mensagem;
  }
}

