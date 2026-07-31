module.exports = async function handleModals(interaction, contexto) {
  const {
    ensureViatura,
    registrarParaTodaViatura,
    saveDb,
  } = contexto;

  if (!interaction.isModalSubmit()) {
    return false;
  }

  if (!interaction.customId.startsWith("modal:")) {
    return false;
  }

  const [, nomeRaw] = interaction.customId.split(":");
  const nome = nomeRaw.toUpperCase().trim();

  const valorTexto = interaction.fields.getTextInputValue("valor");
  const valor = parseInt(valorTexto, 10);

  if (Number.isNaN(valor) || valor <= 0) {
    await interaction.reply({
      content: "❌ Digite um valor válido.",
      ephemeral: true,
    });

    return true;
  }

  const v = ensureViatura(nome);
  const id = interaction.user.id;

  if (!v.membros.includes(id)) {
    await interaction.reply({
      content: "❌ Você precisa estar na viatura.",
      ephemeral: true,
    });

    return true;
  }

  v.dinheiro += valor;

  registrarParaTodaViatura(
    v.membros,
    "dinheiro",
    valor
  );

  saveDb();

  await interaction.reply({
    content: `💰 R$${valor} registrado na viatura ${nome}.`,
    ephemeral: true,
  });

  return true;
};