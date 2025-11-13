import type { FastifyInstance } from "fastify";
import { CobrancaController } from "../controllers/cobranca.controller";

const cobrancaController = new CobrancaController();

export async function cobrancaRoutes(app: FastifyInstance) {
  // POST /api/cobrancas - Criar cobrança manual
  app.post("/api/cobrancas", cobrancaController.create.bind(cobrancaController));

  // GET /api/cobrancas - Listar cobranças (com filtros: status, mês, cliente)
  app.get("/api/cobrancas", cobrancaController.list.bind(cobrancaController));

  // GET /api/cobrancas/vencendo-hoje - Cobranças vencendo hoje
  app.get(
    "/api/cobrancas/vencendo-hoje",
    cobrancaController.vencendoHoje.bind(cobrancaController),
  );

  // GET /api/cobrancas/atrasadas - Cobranças atrasadas
  app.get(
    "/api/cobrancas/atrasadas",
    cobrancaController.atrasadas.bind(cobrancaController),
  );

  // GET /api/cobrancas/:id - Buscar cobrança por ID
  app.get(
    "/api/cobrancas/:id",
    cobrancaController.findById.bind(cobrancaController),
  );

  // PUT /api/cobrancas/:id - Atualizar cobrança
  app.put(
    "/api/cobrancas/:id",
    cobrancaController.update.bind(cobrancaController),
  );

  // PATCH /api/cobrancas/:id/pagar - Marcar como pago
  app.patch(
    "/api/cobrancas/:id/pagar",
    cobrancaController.marcarComoPago.bind(cobrancaController),
  );

  // GET /api/cobrancas/resumo-situacao - Resumo de cobranças por situação
  app.get(
    "/api/cobrancas/resumo-situacao",
    cobrancaController.resumoPorSituacao.bind(cobrancaController),
  );
}

