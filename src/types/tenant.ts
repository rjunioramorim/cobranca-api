import { z } from "zod";

// Schema para criar tenant
export const createTenantSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
    slug: z
        .string()
        .min(1, "Slug é obrigatório")
        .max(100, "Slug muito longo")
        .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
    config: z.record(z.string(), z.unknown()).optional(), // Configurações opcionais em JSON
    adminEmail: z.string().email("Email inválido").optional(),
    adminSenha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
    adminNome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo").optional(),
}).refine((data) => {
    // Se forneceu email ou senha, ambos devem ser fornecidos
    if (data.adminEmail || data.adminSenha) {
        return !!(data.adminEmail && data.adminSenha && data.adminNome);
    }
    return true;
}, {
    message: "Se fornecer email ou senha, todos os campos (email, senha e nome) são obrigatórios",
    path: ["adminEmail"],
});

// Schema para atualizar tenant
export const updateTenantSchema = z.object({
    nome: z.string().min(1).max(255).optional(),
    slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens")
        .optional(),
    ativo: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    adminEmail: z.string().email("Email inválido").optional(),
    adminSenha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
    adminNome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo").optional(),
}).refine((data) => {
    // Se forneceu email ou senha, todos devem ser fornecidos
    if (data.adminEmail || data.adminSenha) {
        return !!(data.adminEmail && data.adminSenha && data.adminNome);
    }
    return true;
}, {
    message: "Se fornecer email ou senha, todos os campos (email, senha e nome) são obrigatórios",
    path: ["adminEmail"],
});

// Schema para query params (filtros)
export const listTenantsQuerySchema = z.object({
    ativo: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    search: z.string().optional(),
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10)),
});

// Types inferidos dos schemas
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;

