const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const editalPMCECommand = new SlashCommandBuilder()
  .setName("editalpmce")
  .setDescription("Enviar painel de recrutamento da PMCE");

const editalEmAndamento = new Set();

const perguntasPMCE = [
  ["Qual o nome completo do seu personagem?", 90_000, "1 minuto e 30 segundos"],
  ["Qual o ID do seu personagem?", 120_000, "2 minutos"],
  ["Qual a idade do seu personagem?", 90_000, "1 minuto e 30 segundos"],
  ["Há quanto tempo você participa de servidores de Roleplay?", 90_000, "1 minuto e 30 segundos"],
  ["Você já participou de alguma corporação policial? Se sim, qual foi sua trajetória?", 120_000, "2 minutos"],
  ["O que significa Roleplay para você?", 120_000, "2 minutos"],
  ["Explique com suas palavras o que é Meta Gaming (MG) e por que essa prática é proibida.", 120_000, "2 minutos"],
  ["Explique com suas palavras o que é Power Gaming (PG) e por que essa prática é proibida.", 120_000, "2 minutos"],
  ["Por que você deseja ingressar na PMCE e o que acredita poder agregar à corporação?", 180_000, "3 minutos"],
  [
    "Conte a história completa do seu personagem.\n\nInclua: origem, família, infância, motivações, trajetória de vida, motivo para seguir carreira policial e objetivos dentro da corporação.",
    300_000,
    "5 minutos",
  ],
];

function painelPMCE() {
  return new EmbedBuilder()
    .setTitle("🛡️ EDITAL DE RECRUTAMENTO PMCE")
    .setColor("Blue")
    .setDescription(
      [
        "Seja bem-vindo ao processo seletivo da Polícia Militar do Ceará.",
        "",
        "Antes de iniciar sua inscrição, leia atentamente as orientações abaixo:",
        "",
        "• Você terá apenas uma tentativa para responder o formulário.",
        "• Cada pergunta possui um tempo limite individual.",
        "• O não envio da resposta dentro do prazo resultará no encerramento automático da inscrição.",
        "• Responda de forma clara, objetiva e coerente.",
        "• Informações falsas poderão resultar na eliminação do processo seletivo.",
        "• Ao finalizar, sua inscrição será encaminhada para análise do Comando da PMCE.",
        "",
        "📋 **Total de perguntas:** 10",
        "⏳ **Tempo máximo estimado:** 22 minutos e 30 segundos",
        "",
        "Clique no botão abaixo para iniciar sua inscrição.",
      ].join("\n")
    )
    .setFooter({ text: "PMCE • Polícia Militar do Ceará" })
    .setTimestamp();
}

function botaoIniciar() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pmce_iniciar_edital")
      .setLabel("📝 Iniciar Inscrição")
      .setStyle(ButtonStyle.Success)
  );
}

function botoesAvaliacao(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pmce_aprovar:${userId}`)
      .setLabel("Aprovar")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`pmce_reprovar:${userId}`)
      .setLabel("Reprovar")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`pmce_convocar:${userId}`)
      .setLabel("Convocar")
      .setEmoji("📞")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`pmce_analise:${userId}`)
      .setLabel("Em análise")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
  );
}

function montarEmbedInscricao(user, respostas, status = "📋 Pendente", avaliador = null) {
  const embed = new EmbedBuilder()
    .setTitle("📋 NOVA INSCRIÇÃO PMCE")
    .setColor("Yellow")
    .setDescription(
      [
        `👤 **Candidato:** <@${user.id}>`,
        `🆔 **Discord ID:** ${user.id}`,
        `📌 **Status:** ${status}`,
        avaliador ? `👮 **Avaliador:** <@${avaliador}>` : null,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .setFooter({ text: "PMCE • Sistema de Recrutamento" })
    .setTimestamp();

  respostas.forEach((resposta, index) => {
  const pergunta = perguntasPMCE[index][0];

  const texto = [
    `**Pergunta:** ${pergunta}`,
    "",
    `**Resposta:** ${resposta}`,
  ].join("\n");

  embed.addFields({
    name: `📌 Pergunta ${index + 1}`,
    value: texto.length > 1024 ? texto.slice(0, 1021) + "..." : texto,
  });
});

  return embed;
}

async function iniciarFormulario(interaction) {
  const userId = interaction.user.id;

  if (interaction.channel.id !== process.env.PMCE_EDITAL_CHANNEL) {
    return interaction.reply({
      content: "❌ O edital só pode ser iniciado no canal correto.",
      ephemeral: true,
    });
  }

  if (editalEmAndamento.has(userId)) {
    return interaction.reply({
      content: "❌ Você já possui uma inscrição em andamento.",
      ephemeral: true,
    });
  }

  editalEmAndamento.add(userId);

  const respostas = [];

  await interaction.reply({
    content: "🛡️ **Edital PMCE iniciado.**\n\nAguarde a primeira pergunta...",
    ephemeral: true,
  });

  try {
    for (let i = 0; i < perguntasPMCE.length; i++) {
      const [pergunta, tempo, tempoTexto] = perguntasPMCE[i];

      await interaction.editReply({
        content:
          `🛡️ **EDITAL PMCE**\n\n` +
          `**Pergunta ${i + 1}/10**\n` +
          `${pergunta}\n\n` +
          `⏳ **Tempo para responder:** ${tempoTexto}\n\n` +
          `Digite sua resposta neste canal. Ela será apagada automaticamente.`,
      });

      const coletor = await interaction.channel.awaitMessages({
        filter: (msg) => msg.author.id === userId && !msg.author.bot,
        max: 1,
        time: tempo,
        errors: ["time"],
      });

      const resposta = coletor.first();

      respostas.push(resposta.content);

      await resposta.delete().catch(() => {});
    }

    await interaction.editReply({
      content:
        "✅ **Inscrição concluída com sucesso!**\n\n" +
        "Sua candidatura foi enviada para análise do Comando da PMCE.",
      ephemeral: true,
    });

    const canalPendentes = await interaction.guild.channels
      .fetch(process.env.PMCE_REGISTROS_PENDENTES)
      .catch(() => null);

    if (!canalPendentes) {
      return;
    }

    const embed = montarEmbedInscricao(interaction.user, respostas);

    await canalPendentes.send({
      embeds: [embed],
      components: [botoesAvaliacao(userId)],
    });
  } catch (error) {
    console.error("ERRO EDITAL PMCE:", error);

    await interaction
      .editReply({
        content:
          "❌ **Inscrição encerrada.**\n\n" +
          "O tempo para resposta expirou ou ocorreu um erro durante o formulário.",
        ephemeral: true,
      })
      .catch(() => {});
  } finally {
    editalEmAndamento.delete(userId);
  }
}

async function registrarAvaliacao(interaction, tipo, userId) {
  const avaliadorId = interaction.user.id;

  let status = "📋 Pendente";
  let cor = "Yellow";

  if (tipo === "aprovar") {
    status = "✅ Aprovado";
    cor = "Green";
  }

  if (tipo === "reprovar") {
    status = "❌ Reprovado";
    cor = "Red";
  }

  if (tipo === "convocar") {
    status = "📞 Convocado para entrevista";
    cor = "Blue";
  }

  if (tipo === "analise") {
    status = "📋 Em análise";
    cor = "Orange";
  }

  const embedAntiga = interaction.message.embeds[0];
  const campos = embedAntiga.fields || [];

  const novaEmbed = EmbedBuilder.from(embedAntiga)
  .setColor(cor)
  .setDescription(
    [
      `👤 **Candidato:** <@${userId}>`,
      `🆔 **Discord ID:** ${userId}`,
      `📌 **Status:** ${status}`,
      `👮 **Avaliador:** <@${avaliadorId}>`,
    ].join("\n")
  )
  .setFields(campos)
  .setTimestamp();

if (tipo === "aprovar" && process.env.PMCE_CARGO_APROVADO) {

  const membro = await interaction.guild.members
    .fetch(userId)
    .catch(() => null);

  if (membro) {
    try {
      await membro.roles.add(
        process.env.PMCE_CARGO_APROVADO
      );
    } catch (error) {
      console.error(
        "Erro ao adicionar cargo aprovado:",
        error
      );
    }
  }
}

//teste

await interaction.update({
  embeds: [novaEmbed],
  components: [],
});

  if (tipo === "aprovar") {
    const canalAprovados = await interaction.guild.channels
      .fetch(process.env.PMCE_REGISTROS_APROVADOS)
      .catch(() => null);

    if (canalAprovados) {
      const embedAprovado = EmbedBuilder.from(novaEmbed)
        .setTitle("✅ REGISTRO APROVADO - PMCE")
        .setColor("Green");

      await canalAprovados.send({
        embeds: [embedAprovado],
      });
    }
  }
}

function registrarEditalPMCE(client) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "editalpmce") {
          if (interaction.channel.id !== process.env.PMCE_EDITAL_CHANNEL) {
            return interaction.reply({
              content: "❌ Use este comando apenas no canal de inscrições-edital.",
              ephemeral: true,
            });
          }

          return interaction.reply({
            embeds: [painelPMCE()],
            components: [botaoIniciar()],
          });
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId === "pmce_iniciar_edital") {
          return iniciarFormulario(interaction);
        }

        if (interaction.customId.startsWith("pmce_aprovar:")) {
          const userId = interaction.customId.split(":")[1];
          return registrarAvaliacao(interaction, "aprovar", userId);
        }

        if (interaction.customId.startsWith("pmce_reprovar:")) {
          const userId = interaction.customId.split(":")[1];
          return registrarAvaliacao(interaction, "reprovar", userId);
        }

        if (interaction.customId.startsWith("pmce_convocar:")) {
          const userId = interaction.customId.split(":")[1];
          return registrarAvaliacao(interaction, "convocar", userId);
        }

        if (interaction.customId.startsWith("pmce_analise:")) {
          const userId = interaction.customId.split(":")[1];
          return registrarAvaliacao(interaction, "analise", userId);
        }
      }
    } catch (error) {
      console.error("Erro no sistema de edital PMCE:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: "❌ Ocorreu um erro no sistema de edital.",
            ephemeral: true,
          })
          .catch(() => {});
      }
    }
  });
}

module.exports = {
  registrarEditalPMCE,
  editalPMCECommand,
};