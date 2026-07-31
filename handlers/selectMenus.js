module.exports = async function handleSelectMenus(interaction, contexto) {
  const {
    ensureViatura,
    saveDb,
    buildConfirmarParticipantes,
  } = contexto;

  if (!interaction.isStringSelectMenu()) {
    return false;
  }

  if (!interaction.customId.startsWith("confirm_participantes:")) {
    return false;
  }

  const [, nomeRaw] = interaction.customId.split(":");
  const nome = nomeRaw.toUpperCase().trim();

  const v = ensureViatura(nome);

  if (!v.membros.includes(interaction.user.id)) {
    await interaction.reply({
      content:
        "❌ Apenas integrantes da viatura podem alterar os participantes.",
      ephemeral: true,
    });

    return true;
  }

  if (!v.confirmacao) {
    v.confirmacao = {
      liderId: interaction.user.id,
      participantes: [...v.membros],
    };
  }

  v.confirmacao.participantes = interaction.values;

  saveDb();

  await interaction.update({
    content:
      `🚓 **Confirmar participantes da viatura ${nome}**\n\n` +
      `Participantes confirmados: ${interaction.values
        .map((id) => `<@${id}>`)
        .join(", ")}`,
    components: buildConfirmarParticipantes(nome, v),
  });

  return true;
};