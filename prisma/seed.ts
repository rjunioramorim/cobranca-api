import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Iniciando seed do banco de dados...");

    // Limpar dados existentes (opcional - comentar se quiser manter dados)
    console.log("🧹 Limpando dados existentes...");
    await prisma.cobranca.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.configuracao.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // Criar Tenant de exemplo
    console.log("🏢 Criando tenant de exemplo...");
    const tenant = await prisma.tenant.create({
        data: {
            nome: "Empresa ABC Ltda",
            slug: "empresa-abc",
            ativo: true,
            config: {
                whatsapp: {
                    apiUrl: "https://api.whatsapp.com",
                    enabled: true,
                },
                pix: {
                    provider: "MERCADO_PAGO",
                    enabled: true,
                },
                mensagens: {
                    horarioEnvio: "09:00",
                    lembreteDiasAntes: 1,
                },
            },
        },
    });

    console.log(`✅ Tenant criado: ${tenant.nome} (ID: ${tenant.id}, Slug: ${tenant.slug})`);

    // Criar Usuários
    console.log("👤 Criando usuários...");
    const senhaHash = await bcrypt.hash("senha123", 10);

    // Criar admin total (sem tenant)
    const adminTotal = await prisma.user.create({
        data: {
            email: "admin@admin.com",
            senha: senhaHash,
            nome: "Administrador Total",
            role: "ADMIN",
            isAdmin: true,
            ativo: true,
            tenantId: null, // Admin total não tem tenant
        },
    });

    console.log(`✅ Admin total criado: ${adminTotal.email} (sem tenant)`);

    // Criar usuários do tenant
    const usuarios = await prisma.user.createMany({
        data: [
            {
                tenantId: tenant.id,
                email: "admin@empresa-abc.com",
                senha: senhaHash,
                nome: "Administrador Tenant",
                role: "ADMIN",
                isAdmin: false,
                ativo: true,
            },
            {
                tenantId: tenant.id,
                email: "usuario@empresa-abc.com",
                senha: senhaHash,
                nome: "Usuário Teste",
                role: "USER",
                isAdmin: false,
                ativo: true,
            },
        ],
    });

    console.log(`✅ ${usuarios.count} usuários do tenant criados`);
    console.log("\n📋 Usuários criados:");
    console.log("   📧 admin@admin.com / senha123 (ADMIN TOTAL - sem tenant)");
    console.log("   📧 admin@empresa-abc.com / senha123 (ADMIN TENANT)");
    console.log("   📧 usuario@empresa-abc.com / senha123 (USER)");

    // Criar Configurações do Tenant
    console.log("⚙️ Criando configurações do tenant...");
    await prisma.configuracao.createMany({
        data: [
            {
                tenantId: tenant.id,
                chave: "template_cobranca",
                valor: JSON.stringify({
                    mensagem:
                        "Olá {{nome}}! Sua cobrança de R$ {{valor}} vence hoje ({{vencimento}}). Utilize o Pix abaixo para pagamento.",
                }),
                descricao: "Template de mensagem para cobrança no dia do vencimento",
            },
            {
                tenantId: tenant.id,
                chave: "template_lembrete",
                valor: JSON.stringify({
                    mensagem:
                        "Olá {{nome}}! Lembrete: sua cobrança de R$ {{valor}} vence amanhã ({{vencimento}}).",
                }),
                descricao: "Template de mensagem para lembrete 1 dia antes",
            },
            {
                tenantId: tenant.id,
                chave: "template_inadimplencia",
                valor: JSON.stringify({
                    mensagem:
                        "Olá {{nome}}! Sua cobrança de R$ {{valor}} está atrasada desde {{vencimento}}. Por favor, regularize o pagamento.",
                }),
                descricao: "Template de mensagem para inadimplência",
            },
        ],
    });

    console.log("✅ Configurações criadas");

    // Criar Clientes
    console.log("👥 Criando clientes...");
    const clientes = await prisma.cliente.createMany({
        data: [
            {
                tenantId: tenant.id,
                nome: "João Silva",
                telefone: "5511999999999",
                valor: 150.0,
                diaVencimento: 5,
                ativo: true,
                observacoes: "Cliente preferencial, sempre paga em dia",
            },
            {
                tenantId: tenant.id,
                nome: "Maria Santos",
                telefone: "5511888888888",
                valor: 250.0,
                diaVencimento: 10,
                ativo: true,
                observacoes: "Cliente novo, primeira cobrança",
            },
            {
                tenantId: tenant.id,
                nome: "Pedro Oliveira",
                telefone: "5511777777777",
                valor: 300.0,
                diaVencimento: 15,
                ativo: true,
                observacoes: null,
            },
            {
                tenantId: tenant.id,
                nome: "Ana Costa",
                telefone: "5511666666666",
                valor: 180.0,
                diaVencimento: 20,
                ativo: true,
                observacoes: "Cliente com histórico de atraso",
            },
            {
                tenantId: tenant.id,
                nome: "Carlos Ferreira",
                telefone: "5511555555555",
                valor: 220.0,
                diaVencimento: 25,
                ativo: false,
                observacoes: "Cliente desativado temporariamente",
            },
        ],
    });

    console.log(`✅ ${clientes.count} clientes criados`);

    // Buscar clientes criados para criar cobranças
    const clientesCriados = await prisma.cliente.findMany({
        where: { tenantId: tenant.id },
    });

    // Criar Cobranças
    console.log("💰 Criando cobranças...");
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const cobrancas: Array<{
        tenantId: string;
        clienteId: string;
        valor: number;
        vencimento: Date;
        status: string;
        pixQrCode: string | null;
        pixCopiaECola: string | null;
        pagoEm?: Date | null;
        observacoes: string | null;
    }> = [];

    for (const cliente of clientesCriados.filter((c) => c.ativo)) {
        // Cobrança do mês atual (vencendo hoje ou no futuro)
        const vencimentoAtual = new Date(anoAtual, mesAtual, cliente.diaVencimento);
        if (vencimentoAtual < hoje) {
            vencimentoAtual.setMonth(vencimentoAtual.getMonth() + 1);
        }

        // Cobrança do mês passado (atrasada)
        const vencimentoPassado = new Date(anoAtual, mesAtual - 1, cliente.diaVencimento);
        const pagoEmPassado = new Date(vencimentoPassado);
        pagoEmPassado.setDate(pagoEmPassado.getDate() + 2); // Pago 2 dias após vencimento

        // Cobrança do mês anterior (paga)
        const vencimentoAnterior = new Date(anoAtual, mesAtual - 2, cliente.diaVencimento);
        const pagoEmAnterior = new Date(vencimentoAnterior);
        pagoEmAnterior.setDate(pagoEmAnterior.getDate() + 1); // Pago 1 dia após vencimento

        cobrancas.push(
            // Cobrança atual (pendente)
            {
                tenantId: tenant.id,
                clienteId: cliente.id,
                valor: cliente.valor,
                vencimento: vencimentoAtual,
                status: "PENDENTE",
                pixQrCode: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}5204000053039865802BR5913COBRANCA AUTO6009SAO PAULO62070503***6304`,
                pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}5204000053039865802BR5913COBRANCA AUTO6009SAO PAULO62070503***6304`,
                observacoes: null,
            },
            // Cobrança passada (atrasada)
            {
                tenantId: tenant.id,
                clienteId: cliente.id,
                valor: cliente.valor,
                vencimento: vencimentoPassado,
                status: "ATRASADO",
                pixQrCode: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}5204000053039865802BR5913COBRANCA AUTO6009SAO PAULO62070503***6304`,
                pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}5204000053039865802BR5913COBRANCA AUTO6009SAO PAULO62070503***6304`,
                observacoes: "Cobrança em atraso",
            },
            // Cobrança anterior (paga)
            {
                tenantId: tenant.id,
                clienteId: cliente.id,
                valor: cliente.valor,
                vencimento: vencimentoAnterior,
                status: "PAGO",
                pagoEm: pagoEmAnterior,
                pixQrCode: null,
                pixCopiaECola: null,
                observacoes: "Pagamento recebido",
            },
        );
    }

    await prisma.cobranca.createMany({
        data: cobrancas,
    });

    console.log(`✅ ${cobrancas.length} cobranças criadas`);

    // Resumo
    console.log("\n📊 Resumo do seed:");
    console.log(`   Tenant: ${tenant.nome} (${tenant.slug})`);
    console.log(`   Usuários: ${usuarios.count}`);
    console.log(`   Clientes: ${clientes.count}`);
    console.log(`   Cobranças: ${cobrancas.length}`);
    console.log(`   Configurações: 3`);

    console.log("\n🔑 Informações para usar a API:");
    console.log("\n📝 Login (JWT):");
    console.log(`   POST /api/auth/login`);
    console.log(`   Email: admin@admin.com (ADMIN TOTAL)`);
    console.log(`   Senha: senha123`);
    console.log("\n   OU");
    console.log(`   Email: admin@empresa-abc.com (ADMIN TENANT)`);
    console.log(`   Senha: senha123`);
    console.log("\n   OU");
    console.log(`   Email: usuario@empresa-abc.com (USER)`);
    console.log(`   Senha: senha123`);
    console.log("\n💡 Após login, use o token JWT no header:");
    console.log(`   Authorization: Bearer {token}`);
    console.log("\n✅ Seed concluído com sucesso!");
}

main()
    .catch((e) => {
        console.error("❌ Erro ao executar seed:", e);
        // biome-ignore lint/suspicious/noProcessExit: necessário para sair do processo em caso de erro
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

