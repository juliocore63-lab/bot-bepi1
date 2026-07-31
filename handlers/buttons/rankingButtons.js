module.exports = async function handleRankingButtons(
  interaction,
  contexto
) {
  const {
    getRankingData,
    buildRankingPages,
    buildRankingButtons,
  } = contexto;

  if (!interaction.isButton()) {
    return false;
  }

  if (interaction.customId.startsWith("rank_info:")) {
    await interaction.deferUpdate();
    return true;
  }

  const ehPaginacao =
    interaction.customId.startsWith("rank_prev:") ||
    interaction.customId.startsWith("rank_next:");

  if (!ehPaginacao) {
    return false;
  }

  const [acao, tipo, pageStr] =
    interaction.customId.split(":");

  let page = Number.parseInt(pageStr, 10);

  if (Number.isNaN(page)) {
    page = 0;
  }

  if (acao === "rank_prev") {
    page--;
  }

  if (acao === "rank_next") {
    page++;
  }

  const { titulo, stats } = getRankingData(tipo);

  const pages = buildRankingPages(stats, titulo);

  if (page < 0) {
    page = 0;
  }

  if (page >= pages.length) {
    page = pages.length - 1;
  }

  await interaction.update({
    embeds: [pages[page]],
    components: buildRankingButtons(
      tipo,
      page,
      pages.length
    ),
  });

  return true;
};