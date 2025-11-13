import { z } from "zod";

// Schema para query params (filtros)
export const listMensagensQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  clienteId: z
    .string()
    .uuid("ID do cliente inválido")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  cobrancaId: z
    .string()
    .uuid("ID da cobrança inválido")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  dataInicio: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dataFim: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// Schema para atualização de mensagem
export const updateMensagemSchema = z.object({
  status: z
    .enum(["AGENDADA", "ENVIADA", "FALHOU", "CANCELADA"], {
      errorMap: () => ({ message: "Status deve ser AGENDADA, ENVIADA, FALHOU ou CANCELADA" }),
    })
    .optional(),
  dataEnvio: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === "null" || val === "") {
        return null;
      }

      // Tentar converter formato pt-BR (dd/MM/yyyy HH:mm:ss ou dd/MM/yyyy)
      const ptBrPattern = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/;
      const match = val.match(ptBrPattern);

      if (match) {
        // Formato pt-BR encontrado: dd/MM/yyyy HH:mm:ss
        const [, day, month, year, hour = "00", minute = "00", second = "00"] = match;
        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
          throw new Error("Data de envio inválida (formato pt-BR: dd/MM/yyyy HH:mm:ss)");
        }
        return date;
      }

      // Tentar formato ISO 8601 padrão
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error("Data de envio inválida (use formato ISO 8601: 2025-11-13T10:30:00Z ou pt-BR: dd/MM/yyyy HH:mm:ss)");
      }
      return date;
    }),
  erro: z.string().max(5000, "Mensagem de erro muito longa").optional().nullable(),
  tentativas: z
    .number()
    .int("Tentativas deve ser um número inteiro")
    .min(0, "Tentativas não pode ser negativo")
    .optional(),
});

// Schema para criação de mensagem
export const createMensagemSchema = z.object({
  cobrancaId: z.string().uuid("ID da cobrança inválido").optional().nullable(),
  clienteId: z.string().uuid("ID do cliente inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório").max(20, "Telefone muito longo"),
  mensagem: z.string().min(1, "Mensagem é obrigatória"),
  status: z
    .string()
    .optional()
    .default("AGENDADA")
    .transform((val) => {
      // Valores válidos
      const validStatuses = ["AGENDADA", "ENVIADA", "FALHOU", "CANCELADA"];
      const upperVal = val?.toUpperCase().trim();
      
      // Se for um status válido, retornar
      if (upperVal && validStatuses.includes(upperVal)) {
        return upperVal as "AGENDADA" | "ENVIADA" | "FALHOU" | "CANCELADA";
      }
      
      // Mapear valores comuns de cobrança para status de mensagem
      const statusMap: Record<string, "AGENDADA" | "ENVIADA" | "FALHOU" | "CANCELADA"> = {
        "PENDENTE": "AGENDADA",
        "ATRASADO": "AGENDADA",
        "PAGO": "ENVIADA",
      };
      
      // Se tiver mapeamento, usar
      if (upperVal && statusMap[upperVal]) {
        return statusMap[upperVal];
      }
      
      // Padrão: AGENDADA
      return "AGENDADA";
    }),
  dataAgendamento: z
    .union([
      z.string(),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === "null" || val === "" || val === null || val === undefined) {
        return null;
      }

      // Garantir que é string
      const strVal = String(val).trim();
      if (!strVal) {
        return null;
      }

      // Tentar converter formato pt-BR (dd/MM/yyyy HH:mm:ss ou dd/MM/yyyy)
      const ptBrPattern = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/;
      const match = strVal.match(ptBrPattern);

      if (match) {
        try {
          // Formato pt-BR encontrado: dd/MM/yyyy HH:mm:ss
          const [, day, month, year, hour = "00", minute = "00", second = "00"] = match;
          const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          const date = new Date(isoString);
          if (isNaN(date.getTime())) {
            throw new Error("Data de agendamento inválida (formato pt-BR: dd/MM/yyyy HH:mm:ss)");
          }
          return date;
        } catch (err) {
          throw new Error("Data de agendamento inválida (formato pt-BR: dd/MM/yyyy HH:mm:ss)");
        }
      }

      // Tentar formato ISO 8601 padrão
      try {
        const date = new Date(strVal);
        if (isNaN(date.getTime())) {
          throw new Error("Data de agendamento inválida (use formato ISO 8601: 2025-11-13T10:30:00Z ou pt-BR: dd/MM/yyyy HH:mm:ss)");
        }
        return date;
      } catch (err) {
        throw new Error("Data de agendamento inválida (use formato ISO 8601: 2025-11-13T10:30:00Z ou pt-BR: dd/MM/yyyy HH:mm:ss)");
      }
    }),
});

// Types inferidos dos schemas
export type ListMensagensQuery = z.infer<typeof listMensagensQuerySchema>;
export type UpdateMensagemInput = z.infer<typeof updateMensagemSchema>;
export type CreateMensagemInput = z.infer<typeof createMensagemSchema>;

