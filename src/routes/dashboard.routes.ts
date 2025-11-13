import type { FastifyInstance } from "fastify";
import { DashboardController } from "../controllers/dashboard.controller";

const dashboardController = new DashboardController();

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/stats - Obter estatísticas do dashboard
  app.get("/api/dashboard/stats", dashboardController.getStats.bind(dashboardController));
}

