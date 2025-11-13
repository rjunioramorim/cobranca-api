import { z } from "zod";

// Schema para criar cobrança
export const createCobrancaSchema = z.object({
  clienteId: z.string().uuid("ID do cliente inválido"),
  valor: z.number().positive("Valor deve ser positivo"),
  vencimento: z.coerce.date({
    required_error: "Data de vencimento é obrigatória",
    invalid_type_error: "Data de vencimento inválida",
  }),
  pixQrCode: z.string().optional(),
  pixCopiaECola: z.string().optional(),
  observacoes: z.string().optional(),
});

// Schema para atualizar cobrança
export const updateCobrancaSchema = z.object({
  valor: z.number().positive("Valor deve ser positivo").optional(),
  vencimento: z.coerce.date({
    invalid_type_error: "Data de vencimento inválida",
  }).optional(),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO"], {
    errorMap: () => ({ message: "Status deve ser PENDENTE, PAGO ou ATRASADO" }),
  }).optional(),
  pixQrCode: z.string().optional(),
  pixCopiaECola: z.string().optional(),
  observacoes: z.string().optional(),
});

// Schema para query params (filtros)
export const listCobrancasQuerySchema = z.object({
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO"]).optional(),
  clienteId: z.string().uuid("ID do cliente inválido").optional(),
  mes: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 12) return undefined;
      return num;
    }),
  ano: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 2000 || num > 2100) return undefined;
      return num;
    }),
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
export type CreateCobrancaInput = z.infer<typeof createCobrancaSchema>;
export type UpdateCobrancaInput = z.infer<typeof updateCobrancaSchema>;
export type ListCobrancasQuery = z.infer<typeof listCobrancasQuerySchema>;

// Tipo para mensagem relacionada (resumo)
export interface MensagemResumo {
  id: string;
  status: string;
  dataEnvio: Date | null;
  dataAgendamento: Date | null;
  tentativas: number;
  erro: string | null;
}

// Tipo para item de cobrança no resumo (apenas dados essenciais)
export interface CobrancaResumoItem {
  id: string;
  valor: number;
  vencimento: Date;
  status: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
  };
  mensagens?: MensagemResumo[]; // Mensagens relacionadas a esta cobrança
}

// Tipo para resposta do resumo de cobranças
export interface CobrancasResumoResponse {
  aVencer: CobrancaResumoItem[];
  venceHoje: CobrancaResumoItem[];
  atrasado: CobrancaResumoItem[];
}

