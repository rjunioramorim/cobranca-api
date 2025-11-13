import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { config } from "./config/env";
import { authPlugin, registerAuthHook } from "./middleware/auth.middleware";
import { errorHandlerPlugin } from "./middleware/error-handler.middleware";
import { loggingPlugin } from "./middleware/logging.middleware";
import { authRoutes } from "./routes/auth.routes";
import { tenantRoutes } from "./routes/tenant.routes";
import { clienteRoutes } from "./routes/cliente.routes";
import { cobrancaRoutes } from "./routes/cobranca.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { integrationRoutes } from "./routes/integration.routes";
import { mensagemRoutes } from "./routes/mensagem.routes";

const app = Fastify({
    logger: {
        level: config.NODE_ENV === "production" ? "info" : "debug",
        transport:
            config.NODE_ENV === "development"
                ? {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "HH:MM:ss Z",
                        ignore: "pid,hostname",
                    },
                }
                : undefined,
    },
});

async function start() {
    try {
        // Plugins de segurança
        await app.register(helmet);
        await app.register(cors, {
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-API-Token"],
        });

        // Health check
        app.get("/health", async () => {
            return { status: "ok", timestamp: new Date().toISOString() };
        });

        // Registrar JWT primeiro (antes do authPlugin)
        const jwtPlugin = (await import("@fastify/jwt")).default;
        await app.register(jwtPlugin, {
          secret: config.JWT_SECRET,
          sign: {
            expiresIn: "7d", // Token expira em 7 dias
          },
        });

        // Middleware de logging (deve ser registrado antes de tudo para capturar todas as requisições)
        await app.register(loggingPlugin);

        // Middleware de tratamento de erros (deve ser registrado antes das rotas)
        await app.register(errorHandlerPlugin);

        // Middleware de autenticação (deve ser registrado antes das rotas)
        // O authPlugin identifica o tenant automaticamente
        await app.register(authPlugin);
        
        // Registrar hook de autenticação diretamente no app principal
        // Isso garante que o hook seja aplicado a todas as rotas
        registerAuthHook(app);

        // Rotas da API
        await app.register(authRoutes);
        await app.register(tenantRoutes);
        await app.register(clienteRoutes);
        await app.register(cobrancaRoutes);
        await app.register(dashboardRoutes);
        await app.register(integrationRoutes);
        await app.register(mensagemRoutes);

        await app.listen({ port: config.PORT, host: "0.0.0.0" });
        app.log.info(`🚀 Server running on http://localhost:${config.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();

