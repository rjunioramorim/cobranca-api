import type { FastifyInstance } from "fastify";
import { TenantController } from "../controllers/tenant.controller";

const tenantController = new TenantController();

export async function tenantRoutes(app: FastifyInstance) {
  // GET /api/admin/tenants - Listar tenants (admin total)
  app.get("/api/admin/tenants", tenantController.adminList.bind(tenantController));

  // POST /api/admin/tenants - Criar tenant (admin total)
  app.post("/api/admin/tenants", tenantController.create.bind(tenantController));

  // POST /api/tenants - Criar tenant (mantido para compatibilidade, mas requer admin)
  app.post("/api/tenants", tenantController.create.bind(tenantController));

  // GET /api/tenants - Listar tenants (com filtros)
  app.get("/api/tenants", tenantController.list.bind(tenantController));

  // GET /api/admin/tenants/:id - Buscar tenant por ID (admin total)
  app.get("/api/admin/tenants/:id", tenantController.findById.bind(tenantController));

  // GET /api/tenants/:id - Buscar tenant por ID (mantido para compatibilidade, mas requer admin)
  app.get("/api/tenants/:id", tenantController.findById.bind(tenantController));

  // GET /api/tenants/slug/:slug - Buscar tenant por slug
  app.get("/api/tenants/slug/:slug", tenantController.findBySlug.bind(tenantController));

  // PUT /api/admin/tenants/:id - Atualizar tenant (admin total)
  app.put("/api/admin/tenants/:id", tenantController.update.bind(tenantController));

  // PUT /api/tenants/:id - Atualizar tenant (mantido para compatibilidade, mas requer admin)
  app.put("/api/tenants/:id", tenantController.update.bind(tenantController));

  // DELETE /api/admin/tenants/:id - Desativar tenant (admin total)
  app.delete("/api/admin/tenants/:id", tenantController.deactivate.bind(tenantController));

  // PATCH /api/admin/tenants/:id/ativar - Reativar tenant (admin total)
  app.patch("/api/admin/tenants/:id/ativar", tenantController.activate.bind(tenantController));

  // DELETE /api/tenants/:id - Desativar tenant (mantido para compatibilidade, mas requer admin)
  app.delete("/api/tenants/:id", tenantController.deactivate.bind(tenantController));

  // PATCH /api/tenants/:id/ativar - Reativar tenant (mantido para compatibilidade, mas requer admin)
  app.patch("/api/tenants/:id/ativar", tenantController.activate.bind(tenantController));
}

