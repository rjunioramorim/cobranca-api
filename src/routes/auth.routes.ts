import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login - Login
  app.post("/api/auth/login", authController.login.bind(authController));

  // POST /api/auth/register - Registrar novo usuário
  app.post("/api/auth/register", authController.register.bind(authController));

  // POST /api/auth/refresh - Refresh token
  app.post("/api/auth/refresh", authController.refresh.bind(authController));

  // POST /api/auth/logout - Logout (revoga refresh token)
  app.post("/api/auth/logout", authController.logout.bind(authController));

  // GET /api/auth/me - Obter dados do usuário logado
  app.get("/api/auth/me", authController.me.bind(authController));
}

