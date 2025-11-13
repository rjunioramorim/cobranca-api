import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
});

export const config = envSchema.parse(process.env);

