const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("./config");
const { possuiAcesso, negarAcesso } = require("./permissions");
const { gerarTextoRelatorio } = require("./relatorio");
const { gerarPDFRelatorio } = require("./pdf");
const { AttachmentBuilder } = require("discord.js");
const {
  painelPrincipalEmbed,
  processoEmbed,
} = require("./embeds");
const {
  painelPrincipalComponents,
  selecionarInvestigadoComponent,
  selecionarDestinatarioDepoimento,
  selecionarAutorDepoimento,
  modalNovoProcesso,
  modalConsultar,
  modalIntimacao,
  modalRegistrarDepoimento,
  processoComponents,
  selecionarTipoProva,
  selecionarStatusProcesso,
  selecionarTestemunha,
  modalRegistrarTestemunha,
  confirmarArquivamento,
  consultaComponents,
  historicoEmbed,
} = require("./components");
const processoService = require("./services/processoService");

async function criarCanalDoProcesso(interaction, processo) {
  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: processo.responsavelId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  for (const cargoId of config.cargosAutorizados) {
    permissionOverwrites.push({
      id: cargoId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  return interaction.guild.channels.create({
    name: processo.codigo.toLowerCase(),
    type: ChannelType.GuildText,
    parent: config.categoriaId || undefined,
    topic: `Corregedoria • ${processo.codigo} • Investigado ${processo.investigadoId}`,
    permissionOverwrites,
  });
}

async function handleCorregedoria(interaction) {
  const eComando = interaction.isChatInputCommand() && interaction.commandName === "corregedoria";
  const eComponente =
  (
    interaction.isButton() ||
    interaction.isModalSubmit() ||
    interaction.isUserSelectMenu() ||
    interaction.isStringSelectMenu()
  ) &&
  interaction.customId?.startsWith("corr_");

  if (!eComando && !eComponente) return false;

  console.log(
    "Entrou no handler:",
    interaction.customId,
    interaction.isButton()
);

  if (!interaction.inGuild()) {
    await interaction.reply({ content: "❌ Este recurso só funciona em servidor.", ephemeral: true });
    return true;
  }

  if (!possuiAcesso(interaction)) {
    await negarAcesso(interaction);
    return true;
  }

  if (eComando) {
    await interaction.reply({
      embeds: [painelPrincipalEmbed()],
      components: painelPrincipalComponents(),
    });
    return true;
  }

  if (interaction.isButton()) {
    if (interaction.customId === "corr_novo_processo") {
      await interaction.reply({
        content: "Selecione o usuário que será registrado como investigado:",
        components: selecionarInvestigadoComponent(),
        ephemeral: true,
      });
      return true;
    }

    if (interaction.customId === "corr_consultar") {
      await interaction.showModal(modalConsultar());
      return true;
    }

    if (interaction.customId === "corr_estatisticas") {
      const dados = await processoService.estatisticas(interaction.guildId);
      const embed = new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle("📊 Estatísticas da Corregedoria")
        .addFields(
          { name: "Total", value: String(dados.total), inline: true },
          { name: "Em andamento", value: String(dados.emAndamento), inline: true },
          { name: "Concluídos", value: String(dados.concluidos), inline: true },
          { name: "Arquivados", value: String(dados.arquivados), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return true;
    }

    if (interaction.customId.startsWith("corr_intimar_investigado:")) {
  const processoId = interaction.customId.split(":")[1];

  if(
 await bloquearArquivado(interaction, processoId)
) return true;

  return interaction.showModal(
    modalIntimacao(processoId, "INVESTIGADO")
  );
}

if (interaction.customId.startsWith("corr_intimar_depoimento:")) {
  const processoId = interaction.customId.split(":")[1];

  if(
 await bloquearArquivado(interaction, processoId)
) return true;

  await interaction.reply({
    content: "Selecione quem será intimado para prestar depoimento:",
    components: selecionarDestinatarioDepoimento(processoId),
    ephemeral: true,
  });

  return true;
}

if (interaction.customId.startsWith("corr_registrar_depoimento:")) {
  const processoId = interaction.customId.split(":")[1];

  if(
 await bloquearArquivado(interaction, processoId)
) return true;

  await interaction.reply({
    content: "Selecione quem prestou o depoimento:",
    components: selecionarAutorDepoimento(processoId),
    ephemeral: true,
  });

  return true;
}

if (interaction.customId.startsWith("corr_provas:")) {
  const processoId = interaction.customId.split(":")[1];

  if(
 await bloquearArquivado(interaction, processoId)
) return true;

  await interaction.reply({
    content: "Selecione o tipo da prova que será enviada:",
    components: selecionarTipoProva(processoId),
    ephemeral: true,
  });

  return true;
}

if (interaction.customId.startsWith("corr_status:")) {
    const processoId = interaction.customId.split(":")[1];

    if(
 await bloquearArquivado(interaction, processoId)
) return true;

    await interaction.reply({
        content: "🔄 Selecione a nova situação do processo:",
        components: selecionarStatusProcesso(processoId),
        ephemeral: true,
    });

    return true;
}

if (interaction.customId.startsWith("corr_testemunhas:")) {

    const processoId = interaction.customId.split(":")[1];

    if(
 await bloquearArquivado(interaction, processoId)
) return true;

    await interaction.reply({

        content: "Selecione a testemunha:",

        components: selecionarTestemunha(processoId),

        ephemeral: true,

    });

    return true;

}

if (interaction.customId.startsWith("corr_relatorio:")) {

    await interaction.deferReply({
        ephemeral: true,
    });

    try {

        const processoId =
            interaction.customId.split(":")[1];

        const processo =
            await processoService.buscarPorId(processoId);

        if (!processo) {

            return interaction.editReply({
                content: "❌ Processo não encontrado.",
            });

        }

        const texto =
            gerarTextoRelatorio(processo);

        const caminho = await gerarPDFRelatorio(
    processo,
    interaction.client
);

const arquivo = new AttachmentBuilder(
    caminho
);

        await interaction.channel.send({

            content:
                `📄 Relatório do processo **${processo.codigo}**`,

            files: [arquivo],

        });

        processo.historico.push({

            acao: "RELATORIO_GERADO",

            autorId: interaction.user.id,

            detalhes:
                "Relatório PDF emitido.",

        });

        await processo.save();

        await interaction.editReply({

            content:
                "✅ Relatório gerado com sucesso.",

        });

    } catch (err) {

        console.error(err);

        await interaction.editReply({

            content:
                `❌ ${err.message}`,

        });

    }

    return true;

}

if (interaction.customId.startsWith("corr_arquivar:")) {

    const processoId =
        interaction.customId.split(":")[1];


    await interaction.reply({

        content:
        "⚠️ Tem certeza que deseja arquivar este processo?\n\n" +
        "📦 O canal será excluído e o processo ficará disponível apenas para consulta.",

        components:
        confirmarArquivamento(processoId),

        ephemeral: true,

    });


    return true;
}

if (interaction.customId === "corr_fechar_consulta") {
  console.log("Botão fechar consulta acionado");

    await interaction.deferReply({
        ephemeral: true,
    });

    await interaction.editReply({
        content: "🗑️ Fechando consulta..."
    });

    setTimeout(async () => {

        await interaction.channel.delete(
            "Consulta encerrada"
        ).catch(console.error);

    }, 1000);

    return true;
}


if (interaction.customId.startsWith("corr_confirmar_arquivar:")) {

    const processoId =
        interaction.customId.split(":")[1];


    if (interaction.customId.startsWith("corr_confirmar_arquivar:")) {

    const processoId =
        interaction.customId.split(":")[1];


    await interaction.deferReply({
        ephemeral: true,
    });


    try {

        const processo =
            await processoService.buscarPorId(processoId);


        if (!processo) {

            return interaction.editReply({
                content:
                    "❌ Processo não encontrado.",
            });

        }


        // Guarda o canal antes de apagar
        const canal =
            interaction.guild.channels.cache.get(
                processo.canalId
            );


        processo.status = "ARQUIVADO";


        processo.historico.push({

            acao:
                "PROCESSO_ARQUIVADO",

            autorId:
                interaction.user.id,

            detalhes:
                "Processo arquivado pela Corregedoria.",

            data:
                new Date(),

        });


        await processo.save();



        // Mensagem final antes de excluir
        if (canal) {

            await canal.send({

                embeds: [

                    new EmbedBuilder()

                    .setColor(0x000000)

                    .setTitle(
                        "📦 Processo Arquivado"
                    )

                    .setDescription(
                        `O processo **${processo.codigo}** foi arquivado e este canal será encerrado.`
                    )

                    .addFields({

                        name:
                        "Responsável",

                        value:
                        `<@${interaction.user.id}>`

                    })

                    .setTimestamp()

                ]

            });

        }


        // Remove referência do canal no banco
processo.canalId = null;

await processo.save();

// Primeiro responde a interação
await interaction.editReply({
    content: "✅ Processo arquivado e canal removido com sucesso."
});

// Depois apaga o canal
if (canal) {
    await canal.delete(
        "Processo arquivado pela Corregedoria"
    ).catch(() => null);
}

    } catch(error) {


        console.error(
            "Erro ao arquivar:",
            error
        );


        await interaction.editReply({

            content:
            `❌ Erro ao arquivar processo: ${error.message}`

        });

    }


    return true;

}

if (interaction.customId === "corr_cancelar_arquivar") {

    await interaction.update({

        content:
        "❌ Arquivamento cancelado.",

        components: [],

    });

    return true;
}

}

    
  }

  if (interaction.isUserSelectMenu() && interaction.customId === "corr_selecionar_investigado") {
    const investigadoId = interaction.values[0];
    await interaction.showModal(modalNovoProcesso(investigadoId));
    return true;
  }

  if (
    interaction.isUserSelectMenu() &&
    interaction.customId.startsWith("corr_selecionar_depoente:")
) {
    const processoId = interaction.customId.split(":")[1];
    const destinatarioId = interaction.values[0];

    await interaction.showModal(
        modalIntimacao(
            processoId,
            "DEPOIMENTO",
            destinatarioId
        )
    );

    return true;
}

if (
  interaction.isUserSelectMenu() &&
  interaction.customId.startsWith("corr_selecionar_autor_depoimento:")
) {
  const processoId = interaction.customId.split(":")[1];
  const depoenteId = interaction.values[0];

  await interaction.showModal(
    modalRegistrarDepoimento(
      processoId,
      depoenteId
    )
  );

  return true;
}

if (
    interaction.isUserSelectMenu() &&
    interaction.customId.startsWith("corr_selecionar_testemunha:")
) {

    const processoId =
        interaction.customId.split(":")[1];

    const testemunhaId =
        interaction.values[0];

    await interaction.showModal(
        modalRegistrarTestemunha(
            processoId,
            testemunhaId
        )
    );

    return true;

}

if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("corr_alterar_status:")
) {

    const processoId = interaction.customId.split(":")[1];
    const novoStatus = interaction.values[0];

    try {

        const processo =
            await processoService.alterarStatus(
                processoId,
                novoStatus,
                interaction.user.id
            );

        const canal =
            interaction.guild.channels.cache.get(processo.canalId);

        if (processo.mensagemPainelId) {

            const painel =
                await canal.messages
                    .fetch(processo.mensagemPainelId)
                    .catch(() => null);

            if (painel) {

                await painel.edit({
                    embeds: [processoEmbed(processo)],
                    components: processoComponents(processo.id),
                });

            }

        }

        await canal.send({

            embeds: [

                new EmbedBuilder()

                    .setColor(0x3498db)

                    .setTitle("🔄 Situação alterada")

                    .setDescription(
                        `O processo **${processo.codigo}** teve sua situação alterada.`
                    )

                    .addFields(

                        {
                            name: "Nova situação",
                            value: novoStatus,
                            inline: true,
                        },

                        {
                            name: "Responsável",
                            value: `<@${interaction.user.id}>`,
                            inline: true,
                        }

                    )

                    .setTimestamp()

            ]

        });

        await interaction.update({

            content:
                `✅ Situação alterada para **${novoStatus}**.`,

            components: [],

        });

    } catch (err) {

        console.error(err);

        await interaction.update({

            content:
                `❌ ${err.message}`,

            components: [],

        });

    }

    return true;

}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith("corr_tipo_prova:")
) {
  const processoId = interaction.customId.split(":")[1];
  const tipoProva = interaction.values[0];

  await interaction.update({
    content:
      `📎 Envie agora o arquivo do tipo **${tipoProva}** neste canal.\n` +
      "Você tem até **5 minutos**.",
    components: [],
  });

  try {
    const mensagens = await interaction.channel.awaitMessages({
      filter: (mensagem) =>
        mensagem.author.id === interaction.user.id &&
        mensagem.attachments.size > 0,
      max: 1,
      time: 5 * 60 * 1000,
      errors: ["time"],
    });

    const mensagemArquivo = mensagens.first();
    const arquivo = mensagemArquivo.attachments.first();

    const processo = await processoService.registrarProva(
      processoId,
      {
        tipo: tipoProva,
        nome: arquivo.name || "arquivo-sem-nome",
        url: arquivo.url,
        contentType: arquivo.contentType || "",
        tamanho: arquivo.size || 0,
        autorId: interaction.user.id,
        mensagemId: mensagemArquivo.id,
        canalId: mensagemArquivo.channelId,
      }
    );

    const embedProva = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📎 Prova adicionada")
      .addFields(
        {
          name: "📂 Processo",
          value: `\`${processo.codigo}\``,
          inline: true,
        },
        {
          name: "📁 Tipo",
          value: tipoProva,
          inline: true,
        },
        {
          name: "📄 Arquivo",
          value: `[${arquivo.name || "Abrir arquivo"}](${arquivo.url})`,
          inline: false,
        },
        {
          name: "👮 Adicionado por",
          value: `<@${interaction.user.id}>`,
          inline: true,
        }
      )
      .setFooter({
        text: "Corregedoria • Central Operacional PMCE",
      })
      .setTimestamp();

    await interaction.channel.send({
      embeds: [embedProva],
    });

    if (processo.mensagemPainelId) {
      const mensagemPainel = await interaction.channel.messages
        .fetch(processo.mensagemPainelId)
        .catch(() => null);

      if (mensagemPainel) {
        await mensagemPainel.edit({
          embeds: [processoEmbed(processo)],
          components: processoComponents(processo.id),
        });
      }
    }

    await interaction.editReply({
      content:
        `✅ A prova **${arquivo.name || "arquivo"}** foi adicionada ao processo **${processo.codigo}**.`,
      components: [],
    });
  } catch (error) {
    if (
      error?.message?.includes("time") ||
      error?.name === "Collection"
    ) {
      await interaction.editReply({
        content:
          "⌛ O tempo de 5 minutos terminou. Clique novamente em **Provas** para tentar outra vez.",
        components: [],
      });

      return true;
    }

    console.error("❌ Erro ao registrar prova:", error);

    await interaction.editReply({
      content:
        `❌ Não foi possível registrar a prova.\n\nMotivo: ${error.message}`,
      components: [],
    });
  }

  return true;
}

  if (interaction.isModalSubmit() && interaction.customId.startsWith("corr_modal_novo:")) {
    await interaction.deferReply({ ephemeral: true });

    const investigadoId = interaction.customId.split(":")[1];
    const tipo = interaction.fields.getTextInputValue("tipo");
    const motivo = interaction.fields.getTextInputValue("motivo");
    const observacoes = interaction.fields.getTextInputValue("observacoes") || "";

    let processo;
    let canal;

    try {
      processo = await processoService.criarProcesso({
        guildId: interaction.guildId,
        investigadoId,
        responsavelId: interaction.user.id,
        tipo,
        motivo,
        observacoes,
      });

      canal = await criarCanalDoProcesso(interaction, processo);
      const mensagemPainel = await canal.send({
        content: `<@${interaction.user.id}>`,
        embeds: [processoEmbed(processo)],
        components: processoComponents(processo.id),
        allowedMentions: { users: [interaction.user.id] },
      });

      await mensagemPainel.pin().catch(() => null);
      await processoService.vincularCanal(processo.id, canal.id, mensagemPainel.id);

      await interaction.editReply({
        content: `✅ O processo **${processo.codigo}** foi criado com sucesso em ${canal}.`,
      });
    } catch (error) {
      console.error("❌ Erro ao criar processo da Corregedoria:", error);
      if (canal) await canal.delete("Falha ao concluir a criação do processo").catch(() => null);
      if (processo) await processo.deleteOne().catch(() => null);
      await interaction.editReply({
        content: "❌ Não foi possível criar o processo. Verifique as permissões e configurações da Corregedoria.",
      });
    }

    return true;
  }

  async function bloquearArquivado(interaction, processoId){

    const processo =
        await processoService.buscarPorId(processoId);


    if(
        processo &&
        processo.status === "ARQUIVADO"
    ){

        await interaction.reply({

            content:
            "🔒 Processo arquivado. Apenas consulta e relatório são permitidos.",

            ephemeral:true,

        });


        return true;
    }


    return false;

}

if (
  interaction.isModalSubmit() &&
  interaction.customId.startsWith("corr_modal_intimacao:")
) {
  await interaction.deferReply({ ephemeral: true });

  const partes = interaction.customId.split(":");
  const tipoIntimacao = partes[1];
  const processoId = partes[2];
  const destinatarioInformado = partes[3];

  const data = interaction.fields.getTextInputValue("data");
  const horario = interaction.fields.getTextInputValue("horario");
  const local = interaction.fields.getTextInputValue("local");
  const orientacoes =
    interaction.fields.getTextInputValue("orientacoes") || "";

    const processoAtual = await processoService.buscarPorId(processoId);

if (!processoAtual) {
  await interaction.editReply({
    content: "❌ Processo não encontrado.",
  });

  return true;
}

const destinatarioId =
  destinatarioInformado &&
  destinatarioInformado !== "INVESTIGADO"
    ? destinatarioInformado
    : processoAtual.investigadoId;

  try {
    const processo = await processoService.registrarIntimacao(processoId, {
  tipo: tipoIntimacao,
  destinatarioId,
  data,
  horario,
  local,
  orientacoes,
  criadoPorId: interaction.user.id,
});

    const canalProcesso =
      interaction.guild.channels.cache.get(processo.canalId) ||
      interaction.channel;

    const titulo =
      tipoIntimacao === "DEPOIMENTO"
        ? "📜 Intimação para Depoimento"
        : "⚖️ Intimação do Investigado";

    const descricaoTipo =
      tipoIntimacao === "DEPOIMENTO"
        ? "Você está sendo intimado a prestar depoimento referente ao procedimento abaixo."
        : "Você está sendo formalmente intimado referente ao procedimento abaixo.";

    const embedIntimacao = new EmbedBuilder()
      .setColor(tipoIntimacao === "DEPOIMENTO" ? 0xf1c40f : 0x8b0000)
      .setTitle(titulo)
      .setDescription(descricaoTipo)
      .addFields(
        {
          name: "📂 Processo",
          value: `\`${processo.codigo}\``,
          inline: true,
        },
        {
          name: "👤 Destinatário",
          value: `<@${destinatarioId}>`,
          inline: true,
        },
        {
          name: "📅 Data",
          value: data,
          inline: true,
        },
        {
          name: "🕐 Horário",
          value: horario,
          inline: true,
        },
        {
          name: "📍 Local",
          value: local,
          inline: false,
        },
        {
          name: "📝 Orientações",
          value: orientacoes || "Nenhuma orientação adicional.",
          inline: false,
        },
        {
          name: "Responsável pela emissão",
          value: `<@${interaction.user.id}>`,
          inline: false,
        }
      )
      .setFooter({
        text: "Corregedoria • Central Operacional PMCE",
      })
      .setTimestamp();

    const mensagemCanal = await canalProcesso.send({
  content: `<@${destinatarioId}>`,
  embeds: [embedIntimacao],
  allowedMentions: {
    users: [destinatarioId],
  },
});

    let enviadaPorDm = false;

    try {
      const destinatario = await interaction.client.users.fetch(
  destinatarioId
);

await destinatario.send({
  content: `Você recebeu uma nova intimação referente ao processo **${processo.codigo}**.`,
  embeds: [embedIntimacao],
});

      enviadaPorDm = true;
    } catch (erroDm) {
      console.log(
        `Não foi possível enviar a intimação por DM para ${destinatarioId}.`
      );
    }

    const ultimaIntimacao =
      processo.intimacoes[processo.intimacoes.length - 1];

    if (ultimaIntimacao) {
      ultimaIntimacao.mensagemCanalId = mensagemCanal.id;
      ultimaIntimacao.enviadaPorDm = enviadaPorDm;
      await processo.save();
    }

    if (processo.mensagemPainelId) {
      const mensagemPainel = await canalProcesso.messages
        .fetch(processo.mensagemPainelId)
        .catch(() => null);

      if (mensagemPainel) {
        await mensagemPainel.edit({
          embeds: [processoEmbed(processo)],
          components: processoComponents(processo.id),
        });
      }
    }

    await interaction.editReply({
  content: enviadaPorDm
    ? `✅ Intimação registrada e enviada no canal e na mensagem privada de <@${destinatarioId}>.`
    : `⚠️ Intimação registrada no canal, mas não foi possível enviar a mensagem privada para <@${destinatarioId}>. A pessoa pode estar com as DMs bloqueadas.`,
  allowedMentions: {
    users: [],
  },
});
  } catch (error) {
    console.error("Erro ao registrar intimação:", error);

    await interaction.editReply({
      content: `❌ Não foi possível registrar a intimação.\n\nMotivo: ${error.message}`,
    });
  }

  return true;
}

if (
  interaction.isModalSubmit() &&
  interaction.customId.startsWith("corr_modal_registrar_depoimento:")
) {
  await interaction.deferReply({
    ephemeral: true,
  });

  const partes = interaction.customId.split(":");
  const processoId = partes[1];
  const depoenteId = partes[2];

  const data =
    interaction.fields.getTextInputValue("data");

  const horario =
    interaction.fields.getTextInputValue("horario");

  const local =
    interaction.fields.getTextInputValue("local");

  const resumo =
    interaction.fields.getTextInputValue("resumo");

  const observacoes =
    interaction.fields.getTextInputValue("observacoes") || "";

  try {
    const processo = await processoService.registrarDepoimento(
      processoId,
      {
        depoenteId,
        data,
        horario,
        local,
        resumo,
        observacoes,
        registradoPorId: interaction.user.id,
      }
    );

    const canalProcesso =
      interaction.guild.channels.cache.get(processo.canalId) ||
      interaction.channel;

    const embedDepoimento = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("📄 Depoimento Registrado")
      .setDescription(
        "Um novo depoimento foi registrado neste procedimento."
      )
      .addFields(
        {
          name: "📂 Processo",
          value: `\`${processo.codigo}\``,
          inline: true,
        },
        {
          name: "👤 Depoente",
          value: `<@${depoenteId}>`,
          inline: true,
        },
        {
          name: "📅 Data",
          value: data,
          inline: true,
        },
        {
          name: "🕐 Horário",
          value: horario,
          inline: true,
        },
        {
          name: "📍 Local",
          value: local,
          inline: false,
        },
        {
          name: "📝 Resumo do depoimento",
          value: resumo.slice(0, 1024),
          inline: false,
        },
        {
          name: "📎 Observações",
          value:
            (
              observacoes ||
              "Nenhuma observação adicional."
            ).slice(0, 1024),
          inline: false,
        },
        {
          name: "🛡️ Registrado por",
          value: `<@${interaction.user.id}>`,
          inline: false,
        }
      )
      .setFooter({
        text: "Corregedoria • Central Operacional PMCE",
      })
      .setTimestamp();

    const mensagemDepoimento = await canalProcesso.send({
      content: `<@${depoenteId}>`,
      embeds: [embedDepoimento],
      allowedMentions: {
        users: [depoenteId],
      },
    });

    const ultimoDepoimento =
      processo.depoimentos[
        processo.depoimentos.length - 1
      ];

    if (ultimoDepoimento) {
      ultimoDepoimento.mensagemCanalId =
        mensagemDepoimento.id;

      await processo.save();
    }

    if (processo.mensagemPainelId) {
      const mensagemPainel =
        await canalProcesso.messages
          .fetch(processo.mensagemPainelId)
          .catch(() => null);

      if (mensagemPainel) {
        await mensagemPainel.edit({
          embeds: [processoEmbed(processo)],
          components: processoComponents(processo.id),
        });
      }
    }

    await interaction.editReply({
      content:
        `✅ O depoimento de <@${depoenteId}> foi registrado com sucesso no processo **${processo.codigo}**.`,
      allowedMentions: {
        users: [],
      },
    });
  } catch (error) {
    console.error(
      "❌ Erro ao registrar depoimento:",
      error
    );

    await interaction.editReply({
      content:
        `❌ Não foi possível registrar o depoimento.\n\n` +
        `Motivo: ${error.message}`,
    });
  }

  return true;
}

if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("corr_modal_testemunha:")
) {

    await interaction.deferReply({
        ephemeral: true,
    });

    const partes =
        interaction.customId.split(":");

    const processoId = partes[1];
    const testemunhaId = partes[2];

    const data =
        interaction.fields.getTextInputValue("data");

    const horario =
        interaction.fields.getTextInputValue("horario");

    const resumo =
        interaction.fields.getTextInputValue("resumo");

    const observacoes =
        interaction.fields.getTextInputValue("observacoes") || "";

    try {

        const processo =
            await processoService.registrarTestemunha(
                processoId,
                {
                    testemunhaId,
                    data,
                    horario,
                    resumo,
                    observacoes,
                    registradoPorId: interaction.user.id,
                }
            );

        const canal =
            interaction.guild.channels.cache.get(processo.canalId);

        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("👥 Testemunha registrada")
            .addFields(
                {
                    name: "👤 Testemunha",
                    value: `<@${testemunhaId}>`,
                    inline: true,
                },
                {
                    name: "📅 Data",
                    value: data,
                    inline: true,
                },
                {
                    name: "🕐 Horário",
                    value: horario,
                    inline: true,
                },
                {
                    name: "📝 Resumo",
                    value: resumo.slice(0, 1024),
                },
                {
                    name: "📎 Observações",
                    value:
                        (observacoes || "Nenhuma")
                            .slice(0, 1024),
                },
                {
                    name: "👮 Registrado por",
                    value: `<@${interaction.user.id}>`,
                }
            )
            .setTimestamp();

        await canal.send({
            embeds: [embed],
        });

        if (processo.mensagemPainelId) {

            const painel =
                await canal.messages
                    .fetch(processo.mensagemPainelId)
                    .catch(() => null);

            if (painel) {

                await painel.edit({
    embeds: [processoEmbed(processo)],
    components: processoComponents(processo.id),
});

            }

        }

        await interaction.editReply({

            content:
                `✅ Testemunha <@${testemunhaId}> registrada com sucesso.`,

            allowedMentions: {
                users: [],
            },

        });

    } catch (err) {

        console.error(err);

        await interaction.editReply({

            content:
                `❌ ${err.message}`,

        });

    }

    return true;

}

  if (interaction.isModalSubmit() && interaction.customId === "corr_modal_consultar") {

    await interaction.deferReply({
        ephemeral: true
    });


    const codigo =
        interaction.fields.getTextInputValue("codigo");


    const processo =
        await processoService.buscarPorCodigo(
            interaction.guildId,
            codigo
        );


    if (!processo) {

        await interaction.editReply({
            content:
            "❌ Processo não encontrado."
        });

        return true;

    }


    // PROCESSO ARQUIVADO

    if (processo.status === "ARQUIVADO") {


        const canalConsulta =
            await criarCanalConsulta(
                interaction,
                processo
            );


       try {

    await canalConsulta.send({
        embeds: [
            processoEmbed(processo)
        ]
    });

    console.log("✅ Embed enviada com sucesso.");

} catch (err) {

    console.error("Erro ao enviar embed:", err);

}


        await interaction.editReply({

            content:
            `📂 Consulta criada: ${canalConsulta}`

        });


        return true;

    }



    // PROCESSO NORMAL


    await interaction.editReply({

        content:
        processo.canalId
        ? `Canal do processo: <#${processo.canalId}>`
        : "O processo ainda não possui canal vinculado.",

        embeds:[
            processoEmbed(processo)
        ],

    });


    return true;

  }

}

async function criarCanalConsulta(interaction, processo) {

  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel,
      ],
    },

    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },

    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];


  for (const cargoId of config.cargosAutorizados) {

    permissionOverwrites.push({
      id: cargoId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });

  }


  return interaction.guild.channels.create({

    name: `consulta-${processo.codigo.toLowerCase()}`,

    type: ChannelType.GuildText,

    parent: config.categoriaId || undefined,

    topic:
      `Consulta temporária • ${processo.codigo}`,

    permissionOverwrites,

  });

}

module.exports = handleCorregedoria;