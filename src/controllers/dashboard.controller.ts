import type { FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { mes, ano } = request.query as { mes?: string; ano?: string };

      const mesNum = mes ? parseInt(mes, 10) : undefined;
      const anoNum = ano ? parseInt(ano, 10) : undefined;

      const stats = await dashboardService.getStats(
        request.tenantId!,
        mesNum,
        anoNum,
      );

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  }
}

