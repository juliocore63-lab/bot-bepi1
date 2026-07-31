function criarLogService(db) {
  function logAction(userId, tipo, valor = 1) {
    db.historico.push({
      userId,
      tipo,
      valor,
      data: Date.now(),
    });
  }

  function getPeriodoDias(dias) {
    const agora = Date.now();

    return db.historico.filter(
      (item) => agora - item.data <= dias * 86400000
    );
  }

  function calcularStats(lista) {
    const stats = {};

    for (const item of lista) {
      if (!stats[item.userId]) {
        stats[item.userId] = {
          tempo: 0,
          prisoes: 0,
          ocorrencias: 0,
          dinheiro: 0,
          pontos: 0,
        };
      }

      if (item.tipo === "tempo") {
        stats[item.userId].tempo += item.valor;
        stats[item.userId].pontos += Math.floor(item.valor);
      }

      if (item.tipo === "prisao") {
        stats[item.userId].prisoes += item.valor;
        stats[item.userId].pontos += item.valor * 10;
      }

      if (item.tipo === "ocorrencia") {
        stats[item.userId].ocorrencias += item.valor;
        stats[item.userId].pontos += item.valor * 5;
      }

      if (item.tipo === "dinheiro") {
        stats[item.userId].dinheiro += item.valor;
        stats[item.userId].pontos += Math.floor(item.valor / 1000);
      }
    }

    return stats;
  }

  return {
    logAction,
    getPeriodoDias,
    calcularStats,
  };
}

module.exports = criarLogService;