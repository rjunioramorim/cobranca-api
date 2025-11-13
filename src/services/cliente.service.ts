import { prisma } from "../lib/prisma";
import type { CreateClienteInput, UpdateClienteInput, ListClientesQuery } from "../types/cliente";
import { ConflictError, NotFoundError } from "../utils/errors";

export class ClienteService {
    async create(data: CreateClienteInput, tenantId: string) {
        // Verificar se já existe cliente com mesmo telefone no mesmo tenant
        const clienteExistente = await prisma.cliente.findFirst({
            where: {
                tenantId,
                telefone: data.telefone,
                ativo: true,
            },
        });

        if (clienteExistente) {
            throw new ConflictError("Já existe um cliente ativo com este telefone");
        }

        const cliente = await prisma.cliente.create({
            data: {
                tenantId,
                nome: data.nome,
                telefone: data.telefone,
                valor: data.valor,
                diaVencimento: data.diaVencimento,
                observacoes: data.observacoes,
            },
        });

        return cliente;
    }

    async list(query: ListClientesQuery, tenantId: string) {
        const { ativo, search, page = 1, limit = 10, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        const where: {
            tenantId: string;
            ativo?: boolean;
            OR?: Array<
                | { nome: { contains: string; mode: "insensitive" } }
                | { telefone: { contains: string; mode: "insensitive" } }
            >;
        } = {
            tenantId,
        };

        if (ativo !== undefined) {
            where.ativo = ativo;
        }

        if (search) {
            where.OR = [
                { nome: { contains: search, mode: "insensitive" } },
                { telefone: { contains: search, mode: "insensitive" } },
            ];
        }

        // Definir ordenação
        const orderBy =
            sortBy
                ? { [sortBy]: (sortOrder ?? "asc") as "asc" | "desc" }
                : { createdAt: "desc" as const };

        const [clientes, total] = await Promise.all([
            prisma.cliente.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            prisma.cliente.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return {
            data: clientes,
            page,
            pageSize: limit,
            totalItems: total,
            totalPages,
        };
    }

    async findById(id: string, tenantId: string) {
        const cliente = await prisma.cliente.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                cobrancas: {
                    take: 5,
                    orderBy: { vencimento: "desc" },
                },
            },
        });

        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado");
        }

        return cliente;
    }

    async update(id: string, data: UpdateClienteInput, tenantId: string) {
        // Verificar se cliente existe e pertence ao tenant
        const clienteExistente = await prisma.cliente.findFirst({
            where: {
                id,
                tenantId,
            },
        });

        if (!clienteExistente) {
            throw new NotFoundError("Cliente não encontrado");
        }

        // Se está atualizando telefone, verificar se não existe outro cliente ativo com mesmo telefone no mesmo tenant
        if (data.telefone && data.telefone !== clienteExistente.telefone) {
            const telefoneExistente = await prisma.cliente.findFirst({
                where: {
                    tenantId,
                    telefone: data.telefone,
                    ativo: true,
                    id: { not: id },
                },
            });

            if (telefoneExistente) {
                throw new ConflictError("Já existe um cliente ativo com este telefone");
            }
        }

        const cliente = await prisma.cliente.update({
            where: { id },
            data,
        });

        return cliente;
    }

    async deactivate(id: string, tenantId: string) {
        const cliente = await prisma.cliente.findFirst({
            where: {
                id,
                tenantId,
            },
        });

        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado");
        }

        if (!cliente.ativo) {
            throw new Error("Cliente já está desativado");
        }

        const clienteAtualizado = await prisma.cliente.update({
            where: { id },
            data: { ativo: false },
        });

        return clienteAtualizado;
    }

    async activate(id: string, tenantId: string) {
        const cliente = await prisma.cliente.findFirst({
            where: {
                id,
                tenantId,
            },
        });

        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado");
        }

        if (cliente.ativo) {
            throw new Error("Cliente já está ativo");
        }

        // Verificar se existe outro cliente ativo com mesmo telefone no mesmo tenant
        const telefoneExistente = await prisma.cliente.findFirst({
            where: {
                tenantId,
                telefone: cliente.telefone,
                ativo: true,
                id: { not: id },
            },
        });

        if (telefoneExistente) {
            throw new ConflictError("Já existe um cliente ativo com este telefone");
        }

        const clienteAtualizado = await prisma.cliente.update({
            where: { id },
            data: { ativo: true },
        });

        return clienteAtualizado;
    }
}

