import { z } from "zod";

// Schema para criar cliente
export const createClienteSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
    telefone: z
        .string()
        .min(1, "Telefone é obrigatório")
        .max(20, "Telefone muito longo")
        .regex(/^[\d\s\(\)\-\+]+$/, "Telefone inválido"),
    valor: z.number().positive("Valor deve ser positivo"),
    diaVencimento: z
        .number()
        .int("Dia deve ser um número inteiro")
        .min(1, "Dia deve ser entre 1 e 31")
        .max(31, "Dia deve ser entre 1 e 31"),
    observacoes: z.string().optional(),
});

// Schema para atualizar cliente
export const updateClienteSchema = z.object({
    nome: z.string().min(1).max(255).optional(),
    telefone: z
        .string()
        .min(1)
        .max(20)
        .regex(/^[\d\s\(\)\-\+]+$/, "Telefone inválido")
        .optional(),
    valor: z.number().positive().optional(),
    diaVencimento: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional(),
    observacoes: z.string().optional(),
});

// Schema para query params (filtros)
export const listClientesQuerySchema = z.object({
    ativo: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    search: z.string().max(255, "Termo de busca muito longo").optional(),
    sortBy: z
        .enum(["nome", "telefone", "valor", "diaVencimento", "ativo", "createdAt"] as const)
        .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z
        .string()
        .optional()
        .transform((val) => {
            const num = val ? parseInt(val, 10) : 1;
            if (isNaN(num) || num < 1) return 1;
            return num;
        }),
    limit: z
        .string()
        .optional()
        .transform((val) => {
            const num = val ? parseInt(val, 10) : 10;
            if (isNaN(num) || num < 1) return 10;
            if (num > 100) return 100; // Limite máximo
            return num;
        }),
});

// Types inferidos dos schemas
export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
export type ListClientesQuery = z.infer<typeof listClientesQuerySchema>;

