import type { FastifyInstance } from "fastify";
import { ClienteController } from "../controllers/cliente.controller";

const clienteController = new ClienteController();

export async function clienteRoutes(app: FastifyInstance) {
  // POST /api/clientes - Criar cliente
  app.post("/api/clientes", clienteController.create.bind(clienteController));

  // GET /api/clientes - Listar clientes (com filtros)
  app.get("/api/clientes", clienteController.list.bind(clienteController));

  // GET /api/clientes/:id - Buscar cliente por ID
  app.get("/api/clientes/:id", clienteController.findById.bind(clienteController));

  // PUT /api/clientes/:id - Atualizar cliente
  app.put("/api/clientes/:id", clienteController.update.bind(clienteController));

  // DELETE /api/clientes/:id - Desativar cliente (soft delete)
  app.delete("/api/clientes/:id", clienteController.deactivate.bind(clienteController));

  // PATCH /api/clientes/:id/ativar - Reativar cliente
  app.patch("/api/clientes/:id/ativar", clienteController.activate.bind(clienteController));
}

