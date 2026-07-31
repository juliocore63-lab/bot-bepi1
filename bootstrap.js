const { connectMongo } = require("./database/mongo");
const { loadDb, createMongoState } = require("./database/mongoState");
const criarMemberRepository = require("./database/memberRepository");
const criarLogService = require("./services/logService");
const criarPatrulhaService = require("./services/patrulhaService");
const criarRankingUtils = require("./utils/ranking");
const criarPainelUtils = require("./utils/painel");

const {
  formatMinutes,
  formatTempoIndividual,
} = require("./utils/formatter");

const {
  montarEmbedHierarquia,
  gruposHierarquia,
  gruposHierarquia2,
  gruposHierarquia3,
} = require("./utils/hierarquia");

async function criarContextoBot() {
  await connectMongo();

  const db = await loadDb();
  const { saveDb, flush } = createMongoState(db);

  const { ensureMember, ensureViatura } =
    criarMemberRepository(db);

  const {
    logAction,
    getPeriodoDias,
    calcularStats,
  } = criarLogService(db);

  const {
    gerarNumeroPatrulha,
    registrarParaTodaViatura,
    registrarEntrada,
    registrarSaida,
  } = criarPatrulhaService({
    db,
    saveDb,
    ensureMember,
    logAction,
  });

  const {
    buildRankingPages,
    buildRankingButtons,
    getRankingData,
  } = criarRankingUtils({
    db,
    calcularStats,
    getPeriodoDias,
  });

  const {
    buildPainelContent,
    buildButtons,
    buildConfirmarParticipantes,
  } = criarPainelUtils({
    ensureViatura,
  });

  return {
    db,
    saveDb,
    flush,
    ensureMember,
    ensureViatura,
    gerarNumeroPatrulha,
    registrarParaTodaViatura,
    registrarEntrada,
    registrarSaida,
    buildPainelContent,
    buildButtons,
    buildConfirmarParticipantes,
    buildRankingPages,
    buildRankingButtons,
    getRankingData,
    formatMinutes,
    formatTempoIndividual,
    montarEmbedHierarquia,
    gruposHierarquia,
    gruposHierarquia2,
    gruposHierarquia3,
    logAction,
  };
}

module.exports = criarContextoBot;
