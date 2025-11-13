import type { FastifyInstance } from "fastify";
import { MensagemController } from "../controllers/mensagem.controller";

const mensagemController = new MensagemController();

export async function mensagemRoutes(app: FastifyInstance) {
  // POST /api/mensagens - Criar mensagem (permite token de integração)
  app.post("/api/mensagens", mensagemController.create.bind(mensagemController));

  // GET /api/mensagens - Listar mensagens
  app.get("/api/mensagens", mensagemController.list.bind(mensagemController));

  // GET /api/mensagens/:id - Buscar mensagem por ID
  app.get("/api/mensagens/:id", mensagemController.findById.bind(mensagemController));

  // PUT /api/mensagens/:id - Atualizar mensagem (permite token de integração)
  app.put("/api/mensagens/:id", mensagemController.update.bind(mensagemController));

  // PATCH /api/mensagens/:id - Atualizar mensagem (permite token de integração)
  app.patch("/api/mensagens/:id", mensagemController.update.bind(mensagemController));
}

