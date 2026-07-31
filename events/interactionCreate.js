const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const handleSelectMenus = require("../handlers/selectMenus");
const handleModals = require("../handlers/modals");
const handleRankingButtons = require("../handlers/buttons/rankingButtons");
const handleViaturaButtons = require("../handlers/buttons/viaturaButtons");
const handleConfirmFinalizar = require("../handlers/buttons/confirmFinalizar");
const handleCorregedoria = require("../corregedoria/handler");

console.log("Tipo:", typeof handleCorregedoria);
console.log(handleCorregedoria);

module.exports = function registrarInteractionCreate(client, contexto) {
  const {
    db,
    saveDb,
    ensureMember,
    ensureViatura,
    gerarNumeroPatrulha,
    registrarParaTodaViatura,
    registrarEntrada,
    registrarSaida,
    buildPainelContent,
    buildButtons,
    buildConfirmarParticipantes,
    buildRankingPages,
    buildRankingButtons,
    getRankingData,
    formatMinutes,
    formatTempoIndividual,
    montarEmbedHierarquia,
    gruposHierarquia,
    gruposHierarquia2,
    gruposHierarquia3,
    logAction,
  } = contexto;

  client.on("interactionCreate", async (interaction) => {
    try {

      if (await handleCorregedoria(interaction)) {
        return;
      }

      if (await handleSelectMenus(interaction, contexto)) {
       return;
     }
      
      if (interaction.isChatInputCommand()) {
        const guildId = interaction.guild.id;
        const commandName = interaction.commandName;
  
        const servidorPMCE = process.env.GUILD_ID_1;
        const servidorSecundario = process.env.GUILD_ID_2;
  
        if (guildId === servidorSecundario && commandName !== "editalpmce") {
          return interaction.reply({
            content: "❌ Este comando não está disponível neste servidor.",
            ephemeral: true,
          });
        }
  
        if (guildId === servidorPMCE && commandName === "editalpmce") {
          return interaction.reply({
            content: "❌ O edital da PMCE não está disponível neste servidor.",
            ephemeral: true,
          });
        }
      }
  
      if (interaction.isChatInputCommand()) {
  
        // =========================
        // /VIATURA
        // =========================
        if (interaction.commandName === "viatura") {
await interaction.deferReply();
  
          const canaisPatrulhamento = [
    "1141776940911566929",
    "1141776942287298611",
    "1141776944392839290",
    "1141776946481610823",
    "1141776948138360993",
    "1141776949870612480",
    "1141776956237545563",
    "1141776951913234533",
    "1141776953192484864",
  ];
  
  const CANAL_ROCAM = "1141776953192484864";
  
  const canalAtual = interaction.member.voice?.channel;
  
  if (!canalAtual) {
    return await interaction.editReply({
      content:
        "❌ Você precisa estar em um canal de patrulhamento para abrir uma viatura.",
    });
  }
  
  if (!canaisPatrulhamento.includes(canalAtual.id)) {
    return await interaction.editReply({
      content:
        "❌ Você não está em um canal de patrulhamento autorizado.",
    });
  }
  
  const integrantesNaCall = canalAtual.members.filter(
    (membro) => !membro.user.bot
  ).size;
  
  if (
    canalAtual.id !== CANAL_ROCAM &&
    integrantesNaCall < 2
  ) {
    return await interaction.editReply({
      content:
        "❌ É necessário ter no mínimo 2 policiais na chamada para abrir uma viatura.",
    });
  }
  
          const nome = interaction.options.getString("nome");
  
          ensureViatura(nome);
  
          const painelMsg = await interaction.editReply({
    content: buildPainelContent(nome),
    components: buildButtons(nome),
  });
  
  const v = ensureViatura(nome);
  v.messageId = painelMsg.id;
  v.channelId = painelMsg.channel.id;
  
  saveDb();
  
  return;
  
  }
  
        // =========================
        // /RANKING
        // =========================
        if (interaction.commandName === "ranking") {
  
          const { titulo, stats } =
            getRankingData("geral");
  
          const pages =
            buildRankingPages(stats, titulo);
  
          return await interaction.reply({
            embeds: [pages[0]],
            components:
              buildRankingButtons(
                "geral",
                0,
                pages.length
              ),
          });
        }
  
        // =========================
        // /RANKINGSEMANAL
        // =========================
        if (
          interaction.commandName ===
          "rankingsemanal"
        ) {
  
          const { titulo, stats } =
            getRankingData("semanal");
  
          const pages =
            buildRankingPages(stats, titulo);
  
          return await interaction.reply({
            embeds: [pages[0]],
            components:
              buildRankingButtons(
                "semanal",
                0,
                pages.length
              ),
          });
        }
  
        // =========================
        // /RANKINGMENSAL
        // =========================
        if (
          interaction.commandName ===
          "rankingmensal"
        ) {
  
          const { titulo, stats } =
            getRankingData("mensal");
  
          const pages =
            buildRankingPages(stats, titulo);
  
          return await interaction.reply({
            embeds: [pages[0]],
            components:
              buildRankingButtons(
                "mensal",
                0,
                pages.length
              ),
          });
        }
  
        // =========================
        // /MEURANK
        // =========================
        if (
          interaction.commandName ===
          "meurank"
        ) {
  
          const m = ensureMember(
            interaction.user.id
          );
  
          const embed =
            new EmbedBuilder()
              .setTitle(
                "📋 Seu Desempenho Geral"
              )
              .setColor("Blue")
              .addFields(
                {
                  name: "⏱️ Tempo",
                  value: `${m.tempo.toFixed(
                    1
                  )} min`,
                  inline: true,
                },
                {
                  name: "🚔 Prisões",
                  value: String(m.prisoes),
                  inline: true,
                },
                {
                  name: "📦 Ocorrências",
                  value: String(
                    m.ocorrencias
                  ),
                  inline: true,
                },
                {
                  name: "💰 Dinheiro",
                  value: `R$${m.dinheiro}`,
                  inline: true,
                },
                {
                  name: "🏆 Pontos",
                  value: String(m.pontos),
                  inline: true,
                }
              )
              .setTimestamp();
  
          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
  
        // =========================
        // /ATIVIDADE
        // =========================
        if (
          interaction.commandName ===
          "atividade"
        ) {
  
          const membros =
            Object.entries(db.membros)
              .sort(
                (a, b) =>
                  (b[1]
                    .lastPatrolAt || 0) -
                  (a[1]
                    .lastPatrolAt || 0)
              )
              .slice(0, 20);
  
          const descricao =
            membros
              .map(([id, dados]) => {
  
                if (
                  !dados.lastPatrolAt
                ) {
                  return `⚫ <@${id}> — Nunca participou`;
                }
  
                const minutos =
                  Math.floor(
                    (Date.now() -
                      dados.lastPatrolAt) /
                      60000
                  );
  
                if (minutos < 60) {
                  return `🟢 <@${id}> — há ${minutos} min`;
                }
  
                const horas =
                  Math.floor(
                    minutos / 60
                  );
  
                if (horas < 24) {
                  return `🟡 <@${id}> — há ${horas}h`;
                }
  
                const dias =
                  Math.floor(
                    horas / 24
                  );
  
                return `🔴 <@${id}> — há ${dias} dias`;
              })
              .join("\n") ||
            "Sem dados.";
  
          const embed =
            new EmbedBuilder()
              .setTitle(
                "📋 Atividade Operacional"
              )
              .setColor("Blue")
              .setDescription(
                descricao
              )
              .setTimestamp();
  
          return await interaction.reply({
            embeds: [embed],
          });
        }
  
        // =========================
        // /TEMPO
        // =========================
        if (
          interaction.commandName ===
          "tempo"
        ) {
  
          const META = 300;
  
          const membros =
  await Member.find({
    weeklyTime: {
      $gt: 0
    }
  })
  .sort({
    weeklyTime: -1
  });
          const descricao =
            membros
              .map((dados) => {
  
                const tempo =
                  dados.weeklyTime || 0;
  
                let status =
                  "🔴 Abaixo da meta";
  
                if (tempo >= META) {
                  status =
                    "🟢 Meta concluída";
                } else if (
                  tempo >= META * 0.7
                ) {
                  status =
                    "🟡 Próximo da meta";
                }
  
                return `<@${id}> | ⏱️ ${formatMinutes(
                  tempo
                )} | ${status}`;
              })
              .join("\n") ||
            "Sem dados.";
  
          const embed =
            new EmbedBuilder()
              .setTitle(
                "📊 Controle Semanal"
              )
              .setColor("Gold")
              .setDescription(
                descricao
              )
              .addFields({
                name: "📌 Meta semanal",
                value:
                  "05h 00min",
              })
              .setTimestamp();
  
          return await interaction.reply({
            embeds: [embed],
          });
        }
  
// =========================
// /ZERARTEMPO
// =========================
if (
  interaction.commandName === "zerartempo"
) {

  await Member.updateMany(
    {},
    {
      $set: {
        weeklyTime: 0
      }
    }
  );

  return await interaction.reply({
    content:
      "✅ Todos os tempos semanais foram zerados com sucesso.",
    ephemeral: true
  });
}

        // =========================
  // /REMOVERTEMPO
  // =========================
  if (interaction.commandName === "removertempo") {
  
    const usuario = interaction.options.getUser("usuario");
    const minutos = interaction.options.getInteger("minutos");
    const motivo =
      interaction.options.getString("motivo") || "Sem motivo informado";
  
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
       content: "❌ Apenas administradores podem usar este comando.",
       ephemeral: true,
      });
    }
  
    if (minutos <= 0) {
      return await interaction.reply({
        content: "❌ Informe uma quantidade válida de minutos.",
        ephemeral: true,
      });
    }
  
    const membro = ensureMember(usuario.id);
  
    membro.tempo = Math.max(0, membro.tempo - minutos);
    membro.weeklyTime = Math.max(0, membro.weeklyTime - minutos);
    membro.pontos = Math.max(0, membro.pontos - Math.floor(minutos));
  
    logAction(usuario.id, "tempo", -minutos);
  
    saveDb();
  
    const embed = new EmbedBuilder()
      .setTitle("⏱️ Tempo Removido")
      .setColor("Red")
      .addFields(
        {
          name: "👮 Policial",
          value: `<@${usuario.id}>`,
          inline: true,
        },
        {
          name: "⏱️ Tempo removido",
          value: `${minutos} minutos`,
          inline: true,
        },
        {
          name: "👤 Removido por",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: "📌 Motivo",
          value: motivo,
        }
      )
      .setTimestamp();
  
    return await interaction.reply({
      embeds: [embed],
    });
  }
  
        // =========================
        // /HIERARQUIA
        // =========================
        if (
          interaction.commandName ===
          "hierarquia"
        ) {
  
          await interaction.guild.members.fetch();
  
          const embeds = [];
  
          for (const grupo of gruposHierarquia) {
            embeds.push(
              montarEmbedHierarquia(
                interaction.guild,
                grupo
              )
            );
          }
  
          return await interaction.reply({
            embeds,
            allowedMentions: {
              parse: [],
            },
          });
        }
  
        // =========================
        // /HIERARQUIA2
        // =========================
        if (
          interaction.commandName ===
          "hierarquia2"
        ) {
  
          await interaction.guild.members.fetch();
  
          const embeds = [];
  
          for (const grupo of gruposHierarquia2) {
            embeds.push(
              montarEmbedHierarquia(
                interaction.guild,
                grupo
              )
            );
          }
  
          return await interaction.reply({
            embeds,
            allowedMentions: {
              parse: [],
            },
          });
        }
  
        return;
      }
  
      // =====================================
      // BOTÕES
      // =====================================
      if (await handleRankingButtons(interaction, contexto)) {
  return;
}

if (await handleViaturaButtons(interaction, contexto)) {
  return;
}

if (
  await handleConfirmFinalizar(
    interaction,
    contexto,
    client
  )
) {
  return;
}
  
      if (interaction.customId.startsWith("pmce_")) {
        return;
      }
  
      if (await handleModals(interaction, contexto)) {
       return;
      }
  
    } catch (error) {
  console.error("❌ Erro na interação:", {
    commandName: interaction.commandName || null,
    customId: interaction.customId || null,
    type: interaction.type,
    replied: interaction.replied,
    deferred: interaction.deferred,
    error,
  });

  // Não tenta responder novamente se a interação já foi reconhecida.
  if (
    !interaction.isRepliable() ||
    interaction.replied ||
    interaction.deferred
  ) {
    return;
  }

  try {
    await interaction.reply({
      content: "❌ Ocorreu um erro.",
      ephemeral: true,
    });
  } catch (replyError) {
    console.error(
      "❌ Não foi possível enviar a mensagem de erro:",
      replyError
    );
  }
}
  });
};