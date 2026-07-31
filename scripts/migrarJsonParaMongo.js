require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { connectMongo } = require("../database/mongo");

const Member = require("../models/Member");
const Viatura = require("../models/Viatura");
const Historico = require("../models/Historico");
const Config = require("../models/Config");

async function migrarMembros(db) {
    const membros = db.membros || {};
    let total = 0;

    for (const [id, dados] of Object.entries(membros)) {
        await Member.findOneAndUpdate(
            { id },
            {
                $set: {
                    id,
                    nome: dados.nome || "",
                    prisoes: dados.prisoes || 0,
                    ocorrencias: dados.ocorrencias || 0,
                    dinheiro: dados.dinheiro || 0,
                    tempo: dados.tempo || 0,
                    pontos: dados.pontos || 0,
                    atividade: dados.atividade || 0,
                    weeklyTime: dados.weeklyTime || 0,
                    lastPatrolAt: dados.lastPatrolAt
                        ? new Date(dados.lastPatrolAt)
                        : null,
                    patrolStart: dados.patrolStart
                        ? new Date(dados.patrolStart)
                        : null,
                    lastWeeklyReset: dados.lastWeeklyReset
                        ? new Date(dados.lastWeeklyReset)
                        : new Date()
                }
            },
            {
                upsert: true,
                new: true
            }
        );

        total++;
    }

    return total;
}

async function migrarViaturas(db) {
    const viaturas = db.viaturas || {};
    let total = 0;

    for (const [nome, dados] of Object.entries(viaturas)) {
        await Viatura.findOneAndUpdate(
            { nome },
            {
                $set: {
                    nome,
                    membros: dados.membros || [],
                    messageId: dados.messageId || null,
                    channelId: dados.channelId || null,
                    entrada: dados.entrada || {},
                    lider: dados.lider || null,
                    inicio: dados.inicio
                        ? new Date(dados.inicio)
                        : null,
                    prisoes: dados.prisoes || 0,
                    dinheiro: dados.dinheiro || 0,
                    ocorrencias: dados.ocorrencias || 0,
                    tempoIndividual: dados.tempoIndividual || {},
                    historicoEntradas:
                        dados.historicoEntradas || [],
                    historicoSaidas:
                        dados.historicoSaidas || []
                }
            },
            {
                upsert: true,
                new: true
            }
        );

        total++;
    }

    return total;
}

async function migrarHistorico(db) {
    const historico = db.historico || [];

    await Historico.deleteMany({});

    if (historico.length === 0) {
        return 0;
    }

    const documentos = historico.map((item) => ({
        userId: item.userId || null,
        tipo: item.tipo || null,
        valor: item.valor || 0,
        numero: item.numero || null,
        data: item.data
            ? new Date(item.data)
            : new Date(),
        viatura: item.viatura || null,
        comandante: item.comandante || null,
        equipe: item.equipe || [],
        tempo:
            item.tempo !== undefined && item.tempo !== null
                ? String(item.tempo)
                : null,
        prisoes: item.prisoes || 0,
        ocorrencias: item.ocorrencias || 0,
        dinheiro: item.dinheiro || 0
    }));

    await Historico.insertMany(documentos);

    return documentos.length;
}

async function migrarConfig(db) {
    await Config.findOneAndUpdate(
        { chave: "contadorPatrulha" },
        {
            $set: {
                valor: db.contadorPatrulha || 1
            }
        },
        {
            upsert: true,
            new: true
        }
    );
}

async function executarMigracao() {
    try {
        const caminhoDb = path.join(
            __dirname,
            "..",
            "db.json"
        );

        if (!fs.existsSync(caminhoDb)) {
            throw new Error(
                `db.json não encontrado em: ${caminhoDb}`
            );
        }

        const conteudo = fs.readFileSync(
            caminhoDb,
            "utf8"
        );

        const db = JSON.parse(conteudo);

        await connectMongo();

        console.log("Iniciando migração...");

        const membrosMigrados =
            await migrarMembros(db);

        const viaturasMigradas =
            await migrarViaturas(db);

        const historicosMigrados =
            await migrarHistorico(db);

        await migrarConfig(db);

        console.log("Migração concluída com sucesso.");
        console.log(
            `Membros migrados: ${membrosMigrados}`
        );
        console.log(
            `Viaturas migradas: ${viaturasMigradas}`
        );
        console.log(
            `Registros de histórico: ${historicosMigrados}`
        );
        console.log(
            `Contador de patrulha: ${
                db.contadorPatrulha || 1
            }`
        );
    } catch (error) {
        console.error(
            "Erro durante a migração:",
            error
        );

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

executarMigracao();