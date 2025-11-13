import { prisma } from "../lib/prisma";
import type {
  CreateCobrancaInput,
  UpdateCobrancaInput,
  ListCobrancasQuery,
  CobrancasResumoResponse,
  CobrancaResumoItem,
} from "../types/cobranca";
import { NotFoundError, ValidationError } from "../utils/errors";

export class CobrancaService {
  async create(data: CreateCobrancaInput, tenantId: string) {
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

    // Determinar status baseado na data de vencimento
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(data.vencimento);
    vencimento.setHours(0, 0, 0, 0);

    let status = "PENDENTE";
    if (vencimento < hoje) {
      status = "ATRASADO";
    }

    const cobranca = await prisma.cobranca.create({
      data: {
        tenantId,
        clienteId: data.clienteId,
        valor: data.valor,
        vencimento: data.vencimento,
        status,
        pixQrCode: data.pixQrCode,
        pixCopiaECola: data.pixCopiaECola,
        observacoes: data.observacoes,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
    });

    return cobranca;
  }

  async list(query: ListCobrancasQuery, tenantId: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: {
      tenantId: string;
      status?: string;
      clienteId?: string;
      vencimento?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      tenantId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.clienteId) {
      where.clienteId = query.clienteId;
    }

    // Filtro por mês/ano
    if (query.mes || query.ano) {
      const ano = query.ano || new Date().getFullYear();
      const mes = query.mes || new Date().getMonth() + 1;

      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

      where.vencimento = {
        gte: inicioMes,
        lte: fimMes,
      };
    }

    // Buscar cobranças
    const [cobrancas, total] = await Promise.all([
      prisma.cobranca.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
        },
        orderBy: {
          vencimento: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.cobranca.count({ where }),
    ]);

    return {
      data: cobrancas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const cobranca = await prisma.cobranca.findFirst({
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
      },
    });

    if (!cobranca) {
      throw new NotFoundError("Cobrança não encontrada");
    }

    return cobranca;
  }

  async update(id: string, data: UpdateCobrancaInput, tenantId: string) {
    // Verificar se a cobrança existe e pertence ao tenant
    const cobrancaExistente = await prisma.cobranca.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!cobrancaExistente) {
      throw new NotFoundError("Cobrança não encontrada");
    }

    // Se atualizar vencimento, recalcular status
    let status = data.status || cobrancaExistente.status;
    if (data.vencimento) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(data.vencimento);
      vencimento.setHours(0, 0, 0, 0);

      if (vencimento < hoje && cobrancaExistente.status !== "PAGO") {
        status = "ATRASADO";
      } else if (vencimento >= hoje && status !== "PAGO") {
        status = "PENDENTE";
      }
    }

    const cobranca = await prisma.cobranca.update({
      where: { id },
      data: {
        ...data,
        status,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
    });

    return cobranca;
  }

  async marcarComoPago(id: string, tenantId: string) {
    // Verificar se a cobrança existe e pertence ao tenant
    const cobrancaExistente = await prisma.cobranca.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!cobrancaExistente) {
      throw new Error("Cobrança não encontrada");
    }

    if (cobrancaExistente.status === "PAGO") {
      throw new ValidationError("Cobrança já está marcada como paga");
    }

    const cobranca = await prisma.cobranca.update({
      where: { id },
      data: {
        status: "PAGO",
        pagoEm: new Date(),
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
    });

    return cobranca;
  }

  async vencendoHoje(tenantId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);

    const cobrancas = await prisma.cobranca.findMany({
      where: {
        tenantId,
        vencimento: {
          gte: hoje,
          lte: fimHoje,
        },
        status: {
          in: ["PENDENTE", "ATRASADO"],
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
      orderBy: {
        vencimento: "asc",
      },
    });

    return cobrancas;
  }

  async atrasadas(tenantId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cobrancas = await prisma.cobranca.findMany({
      where: {
        tenantId,
        vencimento: {
          lt: hoje,
        },
        status: {
          in: ["PENDENTE", "ATRASADO"],
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
      orderBy: {
        vencimento: "asc",
      },
    });

    return cobrancas;
  }

  /**
   * Busca cobranças agrupadas por situação (a vencer, vence hoje, atrasado)
   * Baseado na data atual do servidor
   */
  async resumoPorSituacao(tenantId: string): Promise<CobrancasResumoResponse> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);

    // Data de 2 dias a partir de hoje (início do dia)
    const doisDiasDepois = new Date(hoje);
    doisDiasDepois.setDate(hoje.getDate() + 2);
    doisDiasDepois.setHours(23, 59, 59, 999);

    // Status permitidos: PENDENTE e ATRASADO (não incluir PAGO)
    const statusPermitidos = ["PENDENTE", "ATRASADO"];

    // Buscar todas as cobranças relevantes em paralelo
    const [aVencer, venceHoje, atrasado] = await Promise.all([
      // A vencer: vencimento entre amanhã e 2 dias depois (não inclui hoje)
      prisma.cobranca.findMany({
        where: {
          tenantId,
          vencimento: {
            gte: new Date(hoje.getTime() + 24 * 60 * 60 * 1000), // Amanhã (início do dia)
            lte: doisDiasDepois,
          },
          status: {
            in: statusPermitidos,
          },
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
          mensagens: {
            select: {
              id: true,
              status: true,
              dataEnvio: true,
              dataAgendamento: true,
              tentativas: true,
              erro: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 2, // Apenas as 2 últimas mensagens
          },
        },
        orderBy: {
          vencimento: "asc",
        },
      }),

      // Vence hoje: vencimento igual à data atual
      prisma.cobranca.findMany({
        where: {
          tenantId,
          vencimento: {
            gte: hoje,
            lte: fimHoje,
          },
          status: {
            in: statusPermitidos,
          },
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
          mensagens: {
            select: {
              id: true,
              status: true,
              dataEnvio: true,
              dataAgendamento: true,
              tentativas: true,
              erro: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 2, // Apenas as 2 últimas mensagens
          },
        },
        orderBy: {
          vencimento: "asc",
        },
      }),

      // Atrasado: vencimento anterior à data atual
      prisma.cobranca.findMany({
        where: {
          tenantId,
          vencimento: {
            lt: hoje,
          },
          status: {
            in: statusPermitidos,
          },
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
          mensagens: {
            select: {
              id: true,
              status: true,
              dataEnvio: true,
              dataAgendamento: true,
              tentativas: true,
              erro: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 2, // Apenas as 2 últimas mensagens
          },
        },
        orderBy: {
          vencimento: "asc",
        },
      }),
    ]);

    return {
      aVencer: aVencer as CobrancaResumoItem[],
      venceHoje: venceHoje as CobrancaResumoItem[],
      atrasado: atrasado as CobrancaResumoItem[],
    };
  }
}

