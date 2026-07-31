const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

function painelPrincipalComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("corr_novo_processo")
        .setLabel("Novo processo")
        .setEmoji("📂")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("corr_consultar")
        .setLabel("Consultar")
        .setEmoji("🔎")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("corr_estatisticas")
        .setLabel("Estatísticas")
        .setEmoji("📊")
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function selecionarInvestigadoComponent() {
  return [
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("corr_selecionar_investigado")
        .setPlaceholder("Selecione o investigado")
        .setMinValues(1)
        .setMaxValues(1)
    ),
  ];
}

function modalNovoProcesso(investigadoId) {
  return new ModalBuilder()
    .setCustomId(`corr_modal_novo:${investigadoId}`)
    .setTitle("Novo processo")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tipo")
          .setLabel("Tipo do procedimento")
          .setPlaceholder("Ex.: investigação preliminar")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("motivo")
          .setLabel("Motivo da abertura")
          .setPlaceholder("Descreva o fato que originou o procedimento")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("observacoes")
          .setLabel("Observações iniciais")
          .setPlaceholder("Opcional")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(false)
      )
    );
}

function modalConsultar() {
  return new ModalBuilder()
    .setCustomId("corr_modal_consultar")
    .setTitle("Consultar processo")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("codigo")
          .setLabel("Número do processo")
          .setPlaceholder("PROC-000001")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      )
    );
}

function modalIntimacao(processoId, tipo, destinatarioId = "INVESTIGADO") {
  const titulo =
    tipo === "DEPOIMENTO"
      ? "Intimação para depoimento"
      : "Intimação do investigado";

  return new ModalBuilder()
    .setCustomId(
  `corr_modal_intimacao:${tipo}:${processoId}:${destinatarioId}`
)
    .setTitle(titulo)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("data")
          .setLabel("Data do comparecimento")
          .setPlaceholder("Ex.: 30/07/2026")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("horario")
          .setLabel("Horário")
          .setPlaceholder("Ex.: 19:30")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("local")
          .setLabel("Local ou canal")
          .setPlaceholder("Ex.: Sala da Corregedoria / Discord")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(150)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("orientacoes")
          .setLabel("Orientações adicionais")
          .setPlaceholder("Documentos necessários, prazo ou instruções")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(false)
      )
    );
}

function selecionarDestinatarioDepoimento(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`corr_selecionar_depoente:${processoId}`)
        .setPlaceholder("Selecione quem será intimado para depor")
        .setMinValues(1)
        .setMaxValues(1)
    ),
  ];
}

function selecionarAutorDepoimento(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`corr_selecionar_autor_depoimento:${processoId}`)
        .setPlaceholder("Selecione quem prestou o depoimento")
        .setMinValues(1)
        .setMaxValues(1)
    ),
  ];
}

function selecionarTestemunha(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`corr_selecionar_testemunha:${processoId}`)
        .setPlaceholder("Selecione a testemunha")
        .setMinValues(1)
        .setMaxValues(1)
    ),
  ];
}

function modalRegistrarTestemunha(processoId, testemunhaId) {
  return new ModalBuilder()
    .setCustomId(
      `corr_modal_testemunha:${processoId}:${testemunhaId}`
    )
    .setTitle("Registrar Testemunha")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("data")
          .setLabel("Data")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("horario")
          .setLabel("Horário")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("resumo")
          .setLabel("Resumo do depoimento")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("observacoes")
          .setLabel("Observações")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      )
    );
}

function modalRegistrarDepoimento(processoId, depoenteId) {
  return new ModalBuilder()
    .setCustomId(
      `corr_modal_registrar_depoimento:${processoId}:${depoenteId}`
    )
    .setTitle("Registrar depoimento")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("data")
          .setLabel("Data do depoimento")
          .setPlaceholder("Ex.: 28/07/2026")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("horario")
          .setLabel("Horário do depoimento")
          .setPlaceholder("Ex.: 19:30")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("local")
          .setLabel("Local ou canal")
          .setPlaceholder("Ex.: Sala da Corregedoria")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(150)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("resumo")
          .setLabel("Resumo do depoimento")
          .setPlaceholder("Descreva os principais pontos informados")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(3000)
          .setRequired(true)
      ),

      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("observacoes")
          .setLabel("Observações adicionais")
          .setPlaceholder("Opcional")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(false)
      )
    );
}

function processoComponents(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`corr_intimar_investigado:${processoId}`)
        .setLabel("Intimar investigado")
        .setEmoji("📨")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`corr_intimar_depoimento:${processoId}`)
        .setLabel("Intimar depoimento")
        .setEmoji("📝")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`corr_registrar_depoimento:${processoId}`)
        .setLabel("Registrar depoimento")
        .setEmoji("📄")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`corr_status:${processoId}`)
        .setLabel("Alterar situação")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`corr_provas:${processoId}`)
        .setLabel("Provas")
        .setEmoji("📎")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`corr_testemunhas:${processoId}`)
        .setLabel("Testemunhas")
        .setEmoji("👥")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`corr_relatorio:${processoId}`)
        .setLabel("Relatório")
        .setEmoji("📄")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`corr_arquivar:${processoId}`)
        .setLabel("Arquivar")
        .setEmoji("📦")
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

function selecionarTipoProva(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`corr_tipo_prova:${processoId}`)
        .setPlaceholder("Selecione o tipo da prova")
        .addOptions(
          {
            label: "Documento",
            value: "DOCUMENTO",
            emoji: "📄",
          },
          {
            label: "PDF",
            value: "PDF",
            emoji: "📑",
          },
          {
            label: "Imagem",
            value: "IMAGEM",
            emoji: "📸",
          },
          {
            label: "Vídeo",
            value: "VIDEO",
            emoji: "🎥",
          },
          {
            label: "Áudio",
            value: "AUDIO",
            emoji: "🎙",
          },
          {
            label: "Outro",
            value: "OUTRO",
            emoji: "📁",
          }
        )
    ),
  ];
}

function selecionarStatusProcesso(processoId) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`corr_alterar_status:${processoId}`)
        .setPlaceholder("Selecione a nova situação do processo")
        .addOptions(
          {
            label: "Em análise",
            value: "EM_ANALISE",
            emoji: "🟡",
          },
          {
            label: "Em diligência",
            value: "EM_DILIGENCIA",
            emoji: "🟠",
          },
          {
            label: "Aguardando depoimento",
            value: "AGUARDANDO_DEPOIMENTO",
            emoji: "🟣",
          },
          {
            label: "Concluído",
            value: "CONCLUIDO",
            emoji: "🔵",
          },
          {
            label: "Arquivado",
            value: "ARQUIVADO",
            emoji: "⚫",
          }
        )
    ),
  ];
}

function confirmarArquivamento(processoId) {

    return [
        new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId(`corr_confirmar_arquivar:${processoId}`)
                .setLabel("Confirmar")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Danger),


            new ButtonBuilder()
                .setCustomId("corr_cancelar_arquivar")
                .setLabel("Cancelar")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Secondary)

        )
    ];

}

function consultaComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("corr_fechar_consulta")
        .setLabel("Fechar consulta")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

module.exports = {
  painelPrincipalComponents,
  selecionarInvestigadoComponent,
  selecionarDestinatarioDepoimento,
  modalNovoProcesso,
  modalConsultar,
  modalIntimacao,
  processoComponents,
  selecionarAutorDepoimento,
  modalRegistrarDepoimento,
  selecionarTipoProva,
  selecionarStatusProcesso,
  selecionarTestemunha,
  modalRegistrarTestemunha,
  confirmarArquivamento,
  consultaComponents,
};
