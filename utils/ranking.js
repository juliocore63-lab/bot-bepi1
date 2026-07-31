const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

function criarRankingUtils({
  db,
  calcularStats,
  getPeriodoDias,
}) {
  function buildRankingPages(stats, titulo) {
    const ranking = Object.entries(stats).sort(
      (a, b) => b[1].pontos - a[1].pontos
    );

    if (!ranking.length) {
      return [
        new EmbedBuilder()
          .setTitle(titulo)
          .setColor("Gold")
          .setDescription("Sem dados no momento.")
          .setTimestamp(),
      ];
    }

    const pageSize = 10;
    const pages = [];

    for (let i = 0; i < ranking.length; i += pageSize) {
      const chunk = ranking.slice(i, i + pageSize);

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setColor("Gold")
        .setDescription(
          chunk
            .map(([userId, dados], index) => {
              const pos = i + index + 1;

              return [
                `**${pos}.** <@${userId}>`,
                `⏱️ ${dados.tempo.toFixed(1)} min`,
                `🚔 ${dados.prisoes} prisões`,
                `📦 ${dados.ocorrencias} ocorrências`,
                `💰 R$${dados.dinheiro}`,
                `🏆 ${dados.pontos} pts`,
              ].join(" | ");
            })
            .join("\n")
        )
        .setFooter({
          text: `Página ${Math.floor(i / pageSize) + 1} de ${Math.ceil(
            ranking.length / pageSize
          )}`,
        })
        .setTimestamp();

      pages.push(embed);
    }

    return pages;
  }

  function buildRankingButtons(tipo, page, totalPages) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rank_prev:${tipo}:${page}`)
          .setLabel("⬅️ Anterior")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(`rank_info:${tipo}:${page}`)
          .setLabel(`Página ${page + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`rank_next:${tipo}:${page}`)
          .setLabel("Próxima ➡️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1)
      ),
    ];
  }

  function getRankingData(tipo) {
    if (tipo === "geral") {
      return {
        titulo: "🏆 Ranking Geral",
        stats: calcularStats(db.historico),
      };
    }

    if (tipo === "semanal") {
      return {
        titulo: "📊 Ranking Semanal",
        stats: calcularStats(getPeriodoDias(7)),
      };
    }

    if (tipo === "mensal") {
      return {
        titulo: "📊 Ranking Mensal",
        stats: calcularStats(getPeriodoDias(30)),
      };
    }

    return {
      titulo: "Ranking",
      stats: {},
    };
  }

  return {
    buildRankingPages,
    buildRankingButtons,
    getRankingData,
  };
}

module.exports = criarRankingUtils;