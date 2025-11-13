import type { FastifyInstance } from "fastify";
import { IntegrationController } from "../controllers/integration.controller";

const integrationController = new IntegrationController();

export async function integrationRoutes(app: FastifyInstance) {
  // POST /api/integrations/token - Gerar token de integração
  app.post(
    "/api/integrations/token",
    integrationController.generateToken.bind(integrationController),
  );

  // DELETE /api/integrations/token - Revogar token de integração
  app.delete(
    "/api/integrations/token",
    integrationController.revokeToken.bind(integrationController),
  );
}

