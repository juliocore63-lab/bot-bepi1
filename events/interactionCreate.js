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
const {handleTicketInteraction,} = require("../tickets");
const Member = require("../models/Member");
const handleTempoButtons = require(
  "../handlers/buttons/tempoButtons"
);
const {
  handlePromotionInteraction,
} = require("../promocao");

const handleAtividadeButtons = require(
  "../handlers/buttons/atividadeButtons"
);

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

      if (await handleTicketInteraction(interaction)) {
  return;
}

if (await handleTempoButtons(interaction)) {
  return;
}

if (
  await handleAtividadeButtons(
    interaction,
    contexto
  )
) {
  return;
}

const promotionHandled =
  await handlePromotionInteraction(interaction);

if (promotionHandled) {
  return;
}

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

  const comandosPermitidosNoSecundario = [
    "editalpmce",
    "ticketsetup",
    "add",
    "remove",
  ];

  if (
    guildId === servidorSecundario &&
    !comandosPermitidosNoSecundario.includes(commandName)
  ) {
    return interaction.reply({
      content: "❌ Este comando não está disponível neste servidor.",
      ephemeral: true,
    });
  }

  if (
    guildId === servidorPMCE &&
    commandName === "editalpmce"
  ) {
    return interaction.reply({
      content:
        "❌ O edital da PMCE não está disponível neste servidor.",
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
        // =========================
// /ATIVIDADE
// =========================
// =====================================
// /ATIVIDADE
// =====================================
if (interaction.commandName === "atividade") {
  const CARGO_POLICIA_MILITAR_ID = "1141776608387149924";
  const ITENS_POR_PAGINA = 10;
  const pagina = 0;

  await interaction.deferReply();

  try {
    // Busca os membros do servidor para garantir que todos
    // que possuem o cargo sejam encontrados.
    const membrosServidor =
      await interaction.guild.members.fetch();

    const membros = membrosServidor
      .filter(
        (member) =>
          !member.user.bot &&
          member.roles.cache.has(
            CARGO_POLICIA_MILITAR_ID
          )
      )
      .map((member) => {
        const dados = db.membros?.[member.id] || {};

        return {
          id: member.id,
          lastPatrolAt:
            Number(dados.lastPatrolAt) || null,
        };
      })
      .sort((a, b) => {
        // Quem possui atividade aparece primeiro.
        // Os mais recentes ficam no topo.
        if (a.lastPatrolAt && !b.lastPatrolAt) {
          return -1;
        }

        if (!a.lastPatrolAt && b.lastPatrolAt) {
          return 1;
        }

        return (
          (b.lastPatrolAt || 0) -
          (a.lastPatrolAt || 0)
        );
      });

    if (!membros.length) {
      return interaction.editReply({
        content:
          "❌ Nenhum membro possui o cargo de Polícia Militar.",
      });
    }

    const totalPaginas = Math.max(
      1,
      Math.ceil(
        membros.length / ITENS_POR_PAGINA
      )
    );

    const inicio = pagina * ITENS_POR_PAGINA;

    const membrosPagina = membros.slice(
      inicio,
      inicio + ITENS_POR_PAGINA
    );

    const descricao = membrosPagina
      .map((dados, index) => {
        const posicao = inicio + index + 1;

        if (!dados.lastPatrolAt) {
          return `**${posicao}.** ⚫ <@${dados.id}> — Nunca participou`;
        }

        const diferenca = Math.max(
          0,
          Date.now() - dados.lastPatrolAt
        );

        const minutos = Math.floor(
          diferenca / 60000
        );

        if (minutos < 60) {
          return `**${posicao}.** 🟢 <@${dados.id}> — há ${minutos} minuto(s)`;
        }

        const horas = Math.floor(
          minutos / 60
        );

        if (horas < 24) {
          return `**${posicao}.** 🟡 <@${dados.id}> — há ${horas} hora(s)`;
        }

        const dias = Math.floor(
          horas / 24
        );

        return `**${posicao}.** 🔴 <@${dados.id}> — há ${dias} dia(s)`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("📋 Atividade Operacional")
      .setColor("Blue")
      .setDescription(descricao)
      .addFields({
        name: "📌 Legenda",
        value: [
          "🟢 Atividade recente",
          "🟡 Atividade registrada há algumas horas",
          "🔴 Atividade registrada há um ou mais dias",
          "⚫ Nunca participou",
        ].join("\n"),
      })
      .setFooter({
        text:
          `Página ${pagina + 1}/${totalPaginas}` +
          ` • ${membros.length} policiais`,
      })
      .setTimestamp();

    const botoes =
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(
            `atividade_anterior_${pagina}`
          )
          .setEmoji("⬅️")
          .setStyle(
            ButtonStyle.Secondary
          )
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(
            `atividade_proximo_${pagina}`
          )
          .setEmoji("➡️")
          .setStyle(
            ButtonStyle.Secondary
          )
          .setDisabled(totalPaginas <= 1)
      );

    return interaction.editReply({
      embeds: [embed],
      components:
        totalPaginas > 1
          ? [botoes]
          : [],
    });
  } catch (error) {
    console.error(
      "Erro no comando /atividade:",
      error
    );

    return interaction.editReply({
      content:
        "❌ Não foi possível carregar a atividade dos policiais.",
    });
  }
}

  
        // =========================
        // /TEMPO
        // =========================
        if (interaction.commandName === "tempo") {
  const META = 300;
  const ITENS_POR_PAGINA = 10;

  const membros = await Member.find({
    weeklyTime: {
      $gt: 0,
    },
  }).sort({
    weeklyTime: -1,
  });

  if (!membros.length) {
    return interaction.reply({
      content: "❌ Nenhum tempo semanal registrado.",
      ephemeral: true,
    });
  }

  const pagina = 0;
  const totalPaginas = Math.ceil(
    membros.length / ITENS_POR_PAGINA
  );

  const inicio = pagina * ITENS_POR_PAGINA;
  const membrosPagina = membros.slice(
    inicio,
    inicio + ITENS_POR_PAGINA
  );

  const descricao = membrosPagina
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
    .join("\n");

  const embed = new EmbedBuilder()
    .setTitle("📊 Controle Semanal")
    .setColor("Gold")
    .setDescription(descricao)
    .addFields({
      name: "📌 Meta semanal",
      value: "05h 00min",
    })
    .setFooter({
      text: `Página ${pagina + 1}/${totalPaginas} • ${
        membros.length
      } policiais`,
    })
    .setTimestamp();

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tempo_anterior_${pagina}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`tempo_proximo_${pagina}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(totalPaginas <= 1)
  );

  return interaction.reply({
    embeds: [embed],
    components: totalPaginas > 1 ? [botoes] : [],
  });
}
  
// =========================
// /ZERARTEMPO
// =========================
if (interaction.commandName === "zerartempo") {
  const agora = Date.now();

  // Zera os dados da memória, que é a fonte usada pelo bot.
  for (const membro of Object.values(db.membros)) {
    membro.weeklyTime = 0;

    // Quem estiver em serviço continua contando,
    // mas somente a partir do momento do reset.
    if (membro.patrolStart) {
      membro.patrolStart = agora;
    } else {
      membro.patrolStart = null;
    }

    membro.lastWeeklyReset = agora;
  }

  // Reinicia também o horário de entrada nas viaturas abertas.
  // Isso impede que uma saída futura recupere o período anterior ao reset.
  for (const viatura of Object.values(db.viaturas)) {
    for (const membroId of Object.keys(viatura.entrada || {})) {
      viatura.entrada[membroId] = agora;
    }
  }

  // Salva a memória corrigida no MongoDB.
  await saveDb();

  return interaction.reply({
    content:
      "✅ Todos os tempos semanais foram zerados. As sessões em andamento passaram a contar a partir de agora.",
    ephemeral: true,
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