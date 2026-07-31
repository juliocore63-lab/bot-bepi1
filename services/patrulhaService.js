function criarPatrulhaService({
  db,
  saveDb,
  ensureMember,
  logAction,
}) {
  function gerarNumeroPatrulha() {
    const numero = db.contadorPatrulha || 1;

    db.contadorPatrulha = numero + 1;

    saveDb(db);

    return String(numero).padStart(6, "0");
  }

  function registrarParaTodaViatura(membros, tipo, valor) {
    for (const membroId of membros) {
      const membro = ensureMember(membroId);

      if (tipo === "prisao") {
        membro.prisoes += valor;
        membro.pontos += valor * 10;
      }

      if (tipo === "ocorrencia") {
        membro.ocorrencias += valor;
        membro.pontos += valor * 5;
      }

      if (tipo === "dinheiro") {
        membro.dinheiro += valor;
        membro.pontos += Math.floor(valor / 1000);
      }

      if (tipo === "tempo") {
        membro.tempo += valor;
        membro.pontos += Math.floor(valor);
      }

      logAction(membroId, tipo, valor);
    }
  }

  function registrarEntrada(viatura, userId) {
    if (!viatura.entrada[userId]) {
      viatura.entrada[userId] = Date.now();

      viatura.historicoEntradas.push({
        userId,
        data: Date.now(),
      });
    }
  }

  function registrarSaida(viatura, userId) {
    const entrouEm = viatura.entrada?.[userId];

    if (!entrouEm) return 0;

    const tempoMin = (Date.now() - entrouEm) / 60000;

    if (!viatura.tempoIndividual[userId]) {
      viatura.tempoIndividual[userId] = 0;
    }

    viatura.tempoIndividual[userId] += tempoMin;

    const membro = ensureMember(userId);

    membro.tempo += tempoMin;
    membro.pontos += Math.floor(tempoMin);
    membro.lastPatrolAt = Date.now();

    if (membro.patrolStart) {
      const tempoSemanal = (Date.now() - membro.patrolStart) / 60000;

      membro.weeklyTime += tempoSemanal;
      membro.patrolStart = null;
    }

    logAction(userId, "tempo", tempoMin);

    viatura.historicoSaidas.push({
      userId,
      data: Date.now(),
      tempo: tempoMin,
    });

    delete viatura.entrada[userId];

    return tempoMin;
  }

  return {
    gerarNumeroPatrulha,
    registrarParaTodaViatura,
    registrarEntrada,
    registrarSaida,
  };
}

module.exports = criarPatrulhaService;