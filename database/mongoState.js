const Member = require("../models/Member");
const Viatura = require("../models/Viatura");
const Historico = require("../models/Historico");
const Config = require("../models/Config");

function toTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadDb() {
  const [membrosDocs, viaturasDocs, historicoDocs, contadorDoc] =
    await Promise.all([
      Member.find({}).lean(),
      Viatura.find({}).lean(),
      Historico.find({}).sort({ data: 1, createdAt: 1 }).lean(),
      Config.findOne({ chave: "contadorPatrulha" }).lean(),
    ]);

  const membros = {};
  for (const membro of membrosDocs) {
    membros[membro.id] = {
      nome: membro.nome || "",
      prisoes: membro.prisoes || 0,
      ocorrencias: membro.ocorrencias || 0,
      dinheiro: membro.dinheiro || 0,
      tempo: membro.tempo || 0,
      pontos: membro.pontos || 0,
      atividade: membro.atividade || 0,
      weeklyTime: membro.weeklyTime || 0,
      lastPatrolAt: toTimestamp(membro.lastPatrolAt),
      patrolStart: toTimestamp(membro.patrolStart),
      lastWeeklyReset:
        toTimestamp(membro.lastWeeklyReset) || Date.now(),
    };
  }

  const viaturas = {};
  for (const viatura of viaturasDocs) {
    const nome = viatura.nome.toUpperCase().trim();
    viaturas[nome] = {
      membros: viatura.membros || [],
      messageId: viatura.messageId || null,
      channelId: viatura.channelId || null,
      entrada: viatura.entrada || {},
      lider: viatura.lider || null,
      inicio: toTimestamp(viatura.inicio),
      prisoes: viatura.prisoes || 0,
      dinheiro: viatura.dinheiro || 0,
      ocorrencias: viatura.ocorrencias || 0,
      tempoIndividual: viatura.tempoIndividual || {},
      historicoEntradas: viatura.historicoEntradas || [],
      historicoSaidas: viatura.historicoSaidas || [],
      confirmacao: viatura.confirmacao || null,
    };
  }

  const historico = historicoDocs.map((item) => ({
    ...(item.userId ? { userId: item.userId } : {}),
    ...(item.tipo ? { tipo: item.tipo } : {}),
    ...(item.valor !== undefined ? { valor: item.valor } : {}),
    ...(item.numero ? { numero: item.numero } : {}),
    data: toTimestamp(item.data) || Date.now(),
    ...(item.viatura ? { viatura: item.viatura } : {}),
    ...(item.comandante ? { comandante: item.comandante } : {}),
    ...(item.equipe ? { equipe: item.equipe } : {}),
    ...(item.tempo !== null && item.tempo !== undefined
      ? { tempo: item.tempo }
      : {}),
    ...(item.prisoes !== undefined ? { prisoes: item.prisoes } : {}),
    ...(item.ocorrencias !== undefined
      ? { ocorrencias: item.ocorrencias }
      : {}),
    ...(item.dinheiro !== undefined ? { dinheiro: item.dinheiro } : {}),
  }));

  return {
    membros,
    viaturas,
    historico,
    contadorPatrulha: Number(contadorDoc?.valor) || 1,
  };
}

async function persistSnapshot(snapshot) {
  const membrosEntries = Object.entries(snapshot.membros || {});
  const viaturasEntries = Object.entries(snapshot.viaturas || {});
  const historico = snapshot.historico || [];

  const membroIds = membrosEntries.map(([id]) => id);
  const viaturaNomes = viaturasEntries.map(([nome]) =>
    nome.toUpperCase().trim()
  );

  const membroOperations = membrosEntries.map(([id, dados]) => ({
    updateOne: {
      filter: { id },
      update: {
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
            : new Date(),
          ultimaAtualizacao: new Date(),
        },
      },
      upsert: true,
    },
  }));

  const viaturaOperations = viaturasEntries.map(([nome, dados]) => ({
    updateOne: {
      filter: { nome: nome.toUpperCase().trim() },
      update: {
        $set: {
          nome: nome.toUpperCase().trim(),
          membros: dados.membros || [],
          messageId: dados.messageId || null,
          channelId: dados.channelId || null,
          entrada: dados.entrada || {},
          lider: dados.lider || null,
          inicio: dados.inicio ? new Date(dados.inicio) : null,
          prisoes: dados.prisoes || 0,
          dinheiro: dados.dinheiro || 0,
          ocorrencias: dados.ocorrencias || 0,
          tempoIndividual: dados.tempoIndividual || {},
          historicoEntradas: dados.historicoEntradas || [],
          historicoSaidas: dados.historicoSaidas || [],
          confirmacao: dados.confirmacao || null,
        },
      },
      upsert: true,
    },
  }));

  const historyDocs = historico.map((item) => ({
    userId: item.userId || null,
    tipo: item.tipo || null,
    valor: item.valor || 0,
    numero: item.numero || null,
    data: item.data ? new Date(item.data) : new Date(),
    viatura: item.viatura || null,
    comandante: item.comandante || null,
    equipe: item.equipe || [],
    tempo:
      item.tempo !== undefined && item.tempo !== null
        ? String(item.tempo)
        : null,
    prisoes: item.prisoes || 0,
    ocorrencias: item.ocorrencias || 0,
    dinheiro: item.dinheiro || 0,
  }));

  if (membroOperations.length) {
    await Member.bulkWrite(membroOperations);
  }
  await Member.deleteMany(
    membroIds.length ? { id: { $nin: membroIds } } : {}
  );

  if (viaturaOperations.length) {
    await Viatura.bulkWrite(viaturaOperations);
  }
  await Viatura.deleteMany(
    viaturaNomes.length ? { nome: { $nin: viaturaNomes } } : {}
  );

  // O histórico é salvo como um retrato completo para manter a mesma
  // semântica do antigo db.json, inclusive remoções e correções manuais.
  await Historico.deleteMany({});
  if (historyDocs.length) {
    await Historico.insertMany(historyDocs);
  }

  await Config.findOneAndUpdate(
    { chave: "contadorPatrulha" },
    { $set: { valor: snapshot.contadorPatrulha || 1 } },
    { upsert: true, returnDocument: "after" }
  );
}

function createMongoState(db) {
  let saveQueue = Promise.resolve();

  function saveDb() {
    const snapshot = clone(db);

    saveQueue = saveQueue
      .then(() => persistSnapshot(snapshot))
      .catch((error) => {
        console.error("❌ Erro ao salvar dados no MongoDB:", error);
      });

    return saveQueue;
  }

  function flush() {
    return saveQueue;
  }

  return { saveDb, flush };
}

module.exports = {
  loadDb,
  createMongoState,
};
