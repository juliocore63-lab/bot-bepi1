const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

function criarPainelUtils({ ensureViatura }) {
  function formatEquipe(membros) {
    if (!membros.length) return "Nenhum membro na viatura.";
    return membros.map((id, i) => `P${i + 1}: <@${id}>`).join("\n");
  }

  function buildPainelContent(nome) {
    const v = ensureViatura(nome);
    const lider = v.lider ? `<@${v.lider}>` : "Nenhum";
    const equipe = formatEquipe(v.membros);

    return [
      `🚓 **Viatura ${nome.toUpperCase()}**`,
      `⭐ **Líder:** ${lider}`,
      `👮 **Equipe:**`,
      equipe,
      "",
      `🚔 **Prisões:** ${v.prisoes}`,
      `📦 **Ocorrências:** ${v.ocorrencias}`,
      `💰 **Dinheiro:** R$${v.dinheiro}`,
    ].join("\n");
  }

  function buildButtons(nome) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`entrar:${nome}`)
        .setLabel("Entrar")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`lider:${nome}`)
        .setLabel("Líder")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`sair:${nome}`)
        .setLabel("Sair")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`finalizar:${nome}`)
        .setLabel("Finalizar")
        .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prisao:${nome}`)
        .setLabel("Prisão")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`ocorrencia:${nome}`)
        .setLabel("Ocorrência")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`dinheiro:${nome}`)
        .setLabel("Apreender")
        .setStyle(ButtonStyle.Success)
    );

    return [row1, row2];
  }

  function buildConfirmarParticipantes(nome, v) {
    const participantes =
      v.confirmacao?.participantes || [...v.membros];

    const select = new StringSelectMenuBuilder()
      .setCustomId(`confirm_participantes:${nome}`)
      .setPlaceholder("Selecione quem realmente participou")
      .setMinValues(1)
      .setMaxValues(v.membros.length)
      .addOptions(
        v.membros.map((membroId, index) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`P${index + 1}`)
            .setDescription(`Membro ${index + 1} da viatura`)
            .setValue(membroId)
            .setDefault(participantes.includes(membroId))
        )
      );

    const rowSelect = new ActionRowBuilder().addComponents(select);

    const rowButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_finalizar:${nome}`)
        .setLabel("Confirmar fechamento")
        .setStyle(ButtonStyle.Danger)
    );

    return [rowSelect, rowButton];
  }

  return {
    formatEquipe,
    buildPainelContent,
    buildButtons,
    buildConfirmarParticipantes,
  };
}

module.exports = criarPainelUtils;