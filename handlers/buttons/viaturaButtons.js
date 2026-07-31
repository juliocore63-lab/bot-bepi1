const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = async function handleViaturaButtons(
  interaction,
  contexto
) {
  const {
    ensureViatura,
    ensureMember,
    registrarParaTodaViatura,
    registrarEntrada,
    registrarSaida,
    saveDb,
    buildPainelContent,
    buildButtons,
    buildConfirmarParticipantes,
  } = contexto;

  if (!interaction.isButton()) {
    return false;
  }

  const [tipo, nomeRaw] = interaction.customId.split(":");

  if (
  ![
    "entrar",
    "lider",
    "sair",
    "prisao",
    "ocorrencia",
    "dinheiro",
    "finalizar",
  ].includes(tipo)
) {
  return false;
}

  if (!nomeRaw) {
    return false;
  }

  const nome = nomeRaw.toUpperCase().trim();
  const v = ensureViatura(nome);
  const id = interaction.user.id;

  // =========================
  // ENTRAR
  // =========================
  if (tipo === "entrar") {
    if (!v.membros.includes(id) && v.membros.length < 4) {
      v.membros.push(id);

      registrarEntrada(v, id);

      const membro = ensureMember(id);

      membro.lastPatrolAt = Date.now();
      membro.patrolStart = Date.now();

      if (!v.inicio) {
        v.inicio = Date.now();
      }

      if (!v.lider) {
        v.lider = id;
      }

      saveDb();
    }

    await interaction.update({
      content: buildPainelContent(nome),
      components: buildButtons(nome),
    });

    return true;
  }

  // =========================
  // LÍDER
  // =========================
  if (tipo === "lider") {
    if (!v.membros.includes(id)) {
      await interaction.reply({
        content: "❌ Você precisa estar na viatura.",
        ephemeral: true,
      });

      return true;
    }

    v.lider = id;

    saveDb();

    await interaction.update({
      content: buildPainelContent(nome),
      components: buildButtons(nome),
    });

    return true;
  }

  // =========================
  // SAIR
  // =========================
  if (tipo === "sair") {
    if (!v.membros.includes(id)) {
      await interaction.reply({
        content: "❌ Você não está nessa viatura.",
        ephemeral: true,
      });

      return true;
    }

    registrarSaida(v, id);

    v.membros = v.membros.filter(
      (usuarioId) => usuarioId !== id
    );

    if (v.lider === id) {
      v.lider = v.membros[0] || null;
    }

    if (v.membros.length === 0) {
      v.inicio = null;
      v.prisoes = 0;
      v.ocorrencias = 0;
      v.dinheiro = 0;
      v.entrada = {};
    }

    saveDb();

    await interaction.update({
      content: buildPainelContent(nome),
      components: buildButtons(nome),
    });

    return true;
  }

  // =========================
// PRISÃO
// =========================
if (tipo === "prisao") {
  if (!v.membros.includes(id)) {
    await interaction.reply({
      content: "❌ Você precisa estar na viatura.",
      ephemeral: true,
    });

    return true;
  }

  v.prisoes += 1;

  registrarParaTodaViatura(
    v.membros,
    "prisao",
    1
  );

  saveDb();

  await interaction.update({
    content: buildPainelContent(nome),
    components: buildButtons(nome),
  });

  return true;
}

// =========================
// OCORRÊNCIA
// =========================
if (tipo === "ocorrencia") {
  if (!v.membros.includes(id)) {
    await interaction.reply({
      content: "❌ Você precisa estar na viatura.",
      ephemeral: true,
    });

    return true;
  }

  v.ocorrencias += 1;

  registrarParaTodaViatura(
    v.membros,
    "ocorrencia",
    1
  );

  saveDb();

  await interaction.update({
    content: buildPainelContent(nome),
    components: buildButtons(nome),
  });

  return true;
}

// =========================
// DINHEIRO
// =========================
if (tipo === "dinheiro") {
  if (!v.membros.includes(id)) {
    await interaction.reply({
      content: "❌ Você precisa estar na viatura.",
      ephemeral: true,
    });

    return true;
  }

  const modal = new ModalBuilder()
    .setCustomId(`modal:${nome}`)
    .setTitle("Registrar Apreensão");

  const input = new TextInputBuilder()
    .setCustomId("valor")
    .setLabel("Valor apreendido")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Ex: 5000");

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  await interaction.showModal(modal);

  return true;
}

// =========================
// FINALIZAR
// =========================
if (tipo === "finalizar") {
  if (!v.membros.includes(id)) {
    await interaction.reply({
      content: "❌ Você precisa estar na viatura.",
      ephemeral: true,
    });

    return true;
  }

  v.confirmacao = {
    liderId: id,
    participantes: [...v.membros],
  };

  saveDb();

  await interaction.reply({
    content:
      `🚓 **Confirmar participantes da viatura ${nome}**\n\n` +
      "Todos estão marcados por padrão. Remova quem não participou da patrulha.",
    components: buildConfirmarParticipantes(nome, v),
    ephemeral: true,
  });

  return true;
}

  return false;
};