import { prisma } from "../lib/prisma";

export class DashboardService {
  async getStats(tenantId: string, mes?: number, ano?: number) {
    const hoje = new Date();
    const mesAtual = mes || hoje.getMonth() + 1;
    const anoAtual = ano || hoje.getFullYear();

    // Data inicial e final do mês
    const dataInicio = new Date(anoAtual, mesAtual - 1, 1);
    const dataFim = new Date(anoAtual, mesAtual, 0, 23, 59, 59);

    // Total a receber no mês (cobranças pendentes e atrasadas do mês)
    const totalAReceber = await prisma.cobranca.aggregate({
      where: {
        tenantId,
        vencimento: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: {
          in: ["PENDENTE", "ATRASADO"],
        },
      },
      _sum: {
        valor: true,
      },
    });

    // Total recebido no mês (cobranças pagas do mês)
    const totalRecebido = await prisma.cobranca.aggregate({
      where: {
        tenantId,
        status: "PAGO",
        pagoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _sum: {
        valor: true,
      },
    });

    // Total de inadimplentes (cobranças atrasadas)
    const totalInadimplentes = await prisma.cobranca.aggregate({
      where: {
        tenantId,
        status: "ATRASADO",
      },
      _sum: {
        valor: true,
      },
      _count: {
        id: true,
      },
    });

    // Total de cobranças do mês (para calcular taxa de pagamento)
    const totalCobrancasMes = await prisma.cobranca.aggregate({
      where: {
        tenantId,
        vencimento: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _sum: {
        valor: true,
      },
      _count: {
        id: true,
      },
    });

    // Cobranças pagas do mês
    const cobrancasPagasMes = await prisma.cobranca.count({
      where: {
        tenantId,
        status: "PAGO",
        vencimento: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    // Calcular taxa de pagamento
    const taxaPagamento =
      totalCobrancasMes._count.id > 0
        ? (cobrancasPagasMes / totalCobrancasMes._count.id) * 100
        : 0;

    return {
      totalAReceber: totalAReceber._sum.valor || 0,
      totalRecebido: totalRecebido._sum.valor || 0,
      totalInadimplentes: totalInadimplentes._sum.valor || 0,
      quantidadeInadimplentes: totalInadimplentes._count.id || 0,
      taxaPagamento: Math.round(taxaPagamento * 100) / 100,
      mes: mesAtual,
      ano: anoAtual,
    };
  }
}

