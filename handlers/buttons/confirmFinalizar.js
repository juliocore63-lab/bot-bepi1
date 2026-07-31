const { EmbedBuilder } = require("discord.js");

module.exports = async function handleConfirmFinalizar(
  interaction,
  contexto,
  client
) {
  const {
    db,
    saveDb,
    ensureMember,
    ensureViatura,
    gerarNumeroPatrulha,
    registrarSaida,
    formatTempoIndividual,
    logAction,
  } = contexto;

  if (!interaction.isButton()) {
    return false;
  }

  if (
    !interaction.customId.startsWith(
      "confirm_finalizar:"
    )
  ) {
    return false;
  }

  const [, nomeRaw] =
    interaction.customId.split(":");

  const nome = nomeRaw.toUpperCase().trim();
  const v = ensureViatura(nome);

  if (!v.membros.includes(interaction.user.id)) {
    await interaction.reply({
      content:
        "❌ Apenas integrantes da viatura podem confirmar o fechamento.",
      ephemeral: true,
    });

    return true;
  }

  const lider = v.lider
    ? `<@${v.lider}>`
    : "Nenhum";

  const equipeFinal =
    v.confirmacao?.participantes ||
    [...v.membros];

  const removidos = v.membros.filter(
    (membroId) =>
      !equipeFinal.includes(membroId)
  );

  for (const removidoId of removidos) {
    const m = ensureMember(removidoId);

    const pontosRemover =
      v.prisoes * 10 +
      v.ocorrencias * 5 +
      Math.floor(v.dinheiro / 1000);

    m.prisoes = Math.max(
      0,
      m.prisoes - v.prisoes
    );

    m.ocorrencias = Math.max(
      0,
      m.ocorrencias - v.ocorrencias
    );

    m.dinheiro = Math.max(
      0,
      m.dinheiro - v.dinheiro
    );

    m.pontos = Math.max(
      0,
      m.pontos - pontosRemover
    );

    if (v.prisoes > 0) {
      logAction(
        removidoId,
        "prisao",
        -v.prisoes
      );
    }

    if (v.ocorrencias > 0) {
      logAction(
        removidoId,
        "ocorrencia",
        -v.ocorrencias
      );
    }

    if (v.dinheiro > 0) {
      logAction(
        removidoId,
        "dinheiro",
        -v.dinheiro
      );
    }
  }

  for (const membroId of equipeFinal) {
    registrarSaida(v, membroId);
  }

  const tempoTotal = v.inicio
    ? (
        (Date.now() - v.inicio) /
        60000
      ).toFixed(1)
    : "0.0";

  const numeroPatrulha =
    gerarNumeroPatrulha();

  if (!db.historico) {
    db.historico = [];
  }

  db.historico.push({
    numero: numeroPatrulha,
    data: new Date().toISOString(),
    viatura: nome,
    comandante: v.lider,
    equipe: [...equipeFinal],
    tempo: tempoTotal,
    prisoes: v.prisoes,
    ocorrencias: v.ocorrencias,
    dinheiro: v.dinheiro,
  });

  saveDb();

  const embed = new EmbedBuilder()
    .setTitle(
      `🚔 RELATÓRIO FINAL #${numeroPatrulha} - ${nome}`
    )
    .setColor("Red")
    .addFields(
      {
        name: "⭐ Comandante",
        value: lider,
      },
      {
        name: "🚓 Viatura",
        value: nome.toUpperCase(),
        inline: true,
      },
      {
        name: "⏱️ Tempo",
        value: `${tempoTotal} min`,
        inline: true,
      },
      {
        name: "💰 Dinheiro",
        value: `R$${v.dinheiro}`,
        inline: true,
      },
      {
        name: "🚔 Prisões",
        value: String(v.prisoes),
        inline: true,
      },
      {
        name: "📦 Ocorrências",
        value: String(v.ocorrencias),
        inline: true,
      },
      {
        name: "👮 Equipe",
        value:
          equipeFinal
            .map((id) => `<@${id}>`)
            .join("\n") || "Nenhum",
      },
      {
        name: "❌ Não contabilizados",
        value: removidos.length
          ? removidos
              .map((id) => `<@${id}>`)
              .join("\n")
          : "Nenhum",
      },
      {
        name: "⏱️ Tempo Individual",
        value: formatTempoIndividual(
          v,
          equipeFinal
        ),
      }
    )
    .setTimestamp();

  try {
    if (process.env.LOG_CHANNEL) {
      const canalLog =
        await client.channels.fetch(
          process.env.LOG_CHANNEL
        );

      if (
        canalLog &&
        canalLog.isTextBased()
      ) {
        await canalLog.send({
          embeds: [embed],
        });
      }
    }
  } catch (error) {
    console.error(
      "Erro ao enviar resumo da patrulha para o canal de logs:",
      error
    );
  }

  db.viaturas[nome] = {
    membros: [],
    messageId: null,
    channelId: null,
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

  saveDb();

  try {
    if (v.channelId && v.messageId) {
      const canalPainel =
        await client.channels.fetch(
          v.channelId
        );

      const msgPainel =
        await canalPainel.messages.fetch(
          v.messageId
        );

      await msgPainel.delete();
    }
  } catch (error) {
    console.error(
      "Erro ao apagar painel da viatura:",
      error
    );
  }

  await interaction.update({
    content: "✅ Patrulha finalizada.",
    embeds: [embed],
    components: [],
  });

  return true;
};