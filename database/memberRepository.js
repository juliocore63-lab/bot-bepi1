function criarMemberRepository(db) {
  function ensureMember(id) {
    if (!db.membros) db.membros = {};

    if (!db.membros[id]) {
      db.membros[id] = {
        prisoes: 0,
        ocorrencias: 0,
        dinheiro: 0,
        tempo: 0,
        pontos: 0,
        weeklyTime: 0,
        lastPatrolAt: null,
        patrolStart: null,
        lastWeeklyReset: Date.now(),
      };
    }

    return db.membros[id];
  }

  function ensureViatura(nome) {
    const nomeFormatado = nome.toUpperCase().trim();

    if (!db.viaturas) db.viaturas = {};

    if (!db.viaturas[nomeFormatado]) {
      db.viaturas[nomeFormatado] = {
        membros: [],
        entrada: {},
        lider: null,
        inicio: null,
        prisoes: 0,
        dinheiro: 0,
        ocorrencias: 0,
        tempoIndividual: {},
        historicoEntradas: [],
        historicoSaidas: [],
      };
    }

    const viatura = db.viaturas[nomeFormatado];

    if (!viatura.membros) viatura.membros = [];
    if (!viatura.entrada) viatura.entrada = {};
    if (!viatura.tempoIndividual) viatura.tempoIndividual = {};
    if (!viatura.historicoEntradas) viatura.historicoEntradas = [];
    if (!viatura.historicoSaidas) viatura.historicoSaidas = [];

    return viatura;
  }

  return {
    ensureMember,
    ensureViatura,
  };
}

module.exports = criarMemberRepository;