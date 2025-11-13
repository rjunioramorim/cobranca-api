import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Schema para registro
export const registerSchema = z.object({
  tenantId: z.string().uuid("ID do tenant inválido"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  role: z.enum(["USER", "ADMIN"]).default("USER").optional(),
});

// Schema para atualizar senha
export const updatePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  senhaNova: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

// Schema para refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

// Types inferidos dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

