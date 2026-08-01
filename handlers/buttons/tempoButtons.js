const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const Member = require("../../models/Member");

const META = 300;
const ITENS_POR_PAGINA = 10;

function formatMinutes(totalMinutes) {
  const total = Math.floor(Number(totalMinutes) || 0);

  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  return `${String(horas).padStart(2, "0")}h ${String(
    minutos
  ).padStart(2, "0")}min`;
}

async function handleTempoButtons(interaction) {
  if (!interaction.isButton()) {
    return false;
  }

  if (
    !interaction.customId.startsWith("tempo_anterior_") &&
    !interaction.customId.startsWith("tempo_proximo_")
  ) {
    return false;
  }

  await interaction.deferUpdate();

  const partes = interaction.customId.split("_");
  const paginaAtual = Number(partes[2]);

  const membros = await Member.find({
    weeklyTime: {
      $gt: 0,
    },
  }).sort({
    weeklyTime: -1,
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(membros.length / ITENS_POR_PAGINA)
  );

  let novaPagina = paginaAtual;

  if (interaction.customId.startsWith("tempo_proximo_")) {
    novaPagina += 1;
  }

  if (interaction.customId.startsWith("tempo_anterior_")) {
    novaPagina -= 1;
  }

  novaPagina = Math.max(
    0,
    Math.min(novaPagina, totalPaginas - 1)
  );

  const inicio = novaPagina * ITENS_POR_PAGINA;

  const membrosPagina = membros.slice(
    inicio,
    inicio + ITENS_POR_PAGINA
  );

  const descricao =
    membrosPagina
      .map((dados, index) => {
        const tempo = dados.weeklyTime || 0;

        let status = "🔴 Abaixo da meta";

        if (tempo >= META) {
          status = "🟢 Meta concluída";
        } else if (tempo >= META * 0.7) {
          status = "🟡 Próximo da meta";
        }

        const posicao = inicio + index + 1;

        return [
          `**${posicao}.** <@${dados.id}>`,
          `⏱️ ${formatMinutes(tempo)}`,
          status,
        ].join(" • ");
      })
      .join("\n") || "Nenhum dado nesta página.";

  const embed = new EmbedBuilder()
    .setTitle("📊 Controle Semanal")
    .setColor("Gold")
    .setDescription(descricao)
    .addFields({
      name: "📌 Meta semanal",
      value: "05h 00min",
    })
    .setFooter({
      text: `Página ${novaPagina + 1}/${totalPaginas} • ${
        membros.length
      } policiais`,
    })
    .setTimestamp();

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tempo_anterior_${novaPagina}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(novaPagina === 0),

    new ButtonBuilder()
      .setCustomId(`tempo_proximo_${novaPagina}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(novaPagina >= totalPaginas - 1)
  );

  await interaction.editReply({
    embeds: [embed],
    components: totalPaginas > 1 ? [botoes] : [],
  });

  return true;
}

module.exports = handleTempoButtons;