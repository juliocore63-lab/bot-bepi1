const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const CURSOS_FILE = path.join(__dirname, "cursos_pmce.json");

const cursoPMCECommand = new SlashCommandBuilder()
  .setName("curso")
  .setDescription("Abrir painel de gerenciamento de cursos da PMCE");

function criarDbCursos() {
  const inicial = {
    cursoAtivo: null,
    historico: [],
  };

  if (!fs.existsSync(CURSOS_FILE)) {
    fs.writeFileSync(CURSOS_FILE, JSON.stringify(inicial, null, 2));
    return inicial;
  }

  try {
    const data = JSON.parse(fs.readFileSync(CURSOS_FILE, "utf8"));

    if (!data.cursoAtivo) data.cursoAtivo = null;
    if (!data.historico) data.historico = [];

    return data;
  } catch (error) {
    console.error("Erro ao ler cursos_pmce.json:", error);
    return inicial;
  }
}

let dbCursos = criarDbCursos();

function salvarCursos() {
  fs.writeFileSync(CURSOS_FILE, JSON.stringify(dbCursos, null, 2));
}

function painelAdminCurso() {
  const curso = dbCursos.cursoAtivo;

  const embed = new EmbedBuilder()
    .setTitle("🎓 GERENCIAMENTO DE CURSOS PMCE")
    .setColor("Blue")
    .setFooter({ text: "PMCE • Setor de Instrução" })
    .setTimestamp();

  if (!curso) {
    embed.setDescription(
      [
        "Nenhum curso ativo no momento.",
        "",
        "Use os botões abaixo para abrir ou gerenciar cursos.",
      ].join("\n")
    );
  } else {
    embed.setDescription(
      [
        `📚 **Curso:** ${curso.nome}`,
        `📅 **Data:** ${curso.data}`,
        `⏰ **Horário:** ${curso.horario}`,
        `👮 **Instrutor:** ${curso.instrutor}`,
        `👥 **Vagas:** ${curso.inscritos.length}/${curso.vagas}`,
        `📌 **Status:** ${curso.aberto ? "🟢 Aberto" : "🔒 Fechado"}`,
        "",
        "Use os botões abaixo para administrar este curso.",
      ].join("\n")
    );
  }

  return embed;
}

function botoesAdminCurso() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pmce_curso_abrir")
      .setLabel("Abrir Curso")
      .setEmoji("🎓")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("pmce_curso_lista")
      .setLabel("Ver Inscritos")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("pmce_curso_aviso")
      .setLabel("Aviso Padrão")
      .setEmoji("📢")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("pmce_curso_aviso_personalizado")
      .setLabel("Aviso Personalizado")
      .setEmoji("✉️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("pmce_curso_fechar")
      .setLabel("Fechar Curso")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );
}

function embedCursoPublico() {
  const curso = dbCursos.cursoAtivo;

  if (!curso) {
    return new EmbedBuilder()
      .setTitle("🎓 CURSO PMCE")
      .setColor("Grey")
      .setDescription("Nenhum curso ativo.")
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setTitle(curso.aberto ? "🎓 CURSO ABERTO - PMCE" : "🔒 CURSO ENCERRADO - PMCE")
    .setColor(curso.aberto ? "Green" : "Red")
    .setDescription(
      [
        `📚 **Curso:** ${curso.nome}`,
        `📅 **Data:** ${curso.data}`,
        `⏰ **Horário:** ${curso.horario}`,
        `👮 **Instrutor:** ${curso.instrutor}`,
        `👥 **Vagas:** ${curso.inscritos.length}/${curso.vagas}`,
        "",
        "⚠️ Ao se inscrever, você assume o compromisso de comparecer ao curso.",
      ].join("\n")
    )
    .setFooter({ text: "PMCE • Setor de Instrução" })
    .setTimestamp();
}

function botoesCursoPublico() {
  const curso = dbCursos.cursoAtivo;

  if (!curso || !curso.aberto) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pmce_curso_ver_inscritos")
        .setLabel("Ver Inscritos")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pmce_curso_inscrever")
      .setLabel("Inscrever-se")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("pmce_curso_ver_inscritos")
      .setLabel("Ver Inscritos")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Primary)
  );
}

function modalAbrirCurso() {
  const modal = new ModalBuilder()
    .setCustomId("pmce_modal_abrir_curso")
    .setTitle("Abrir Curso PMCE");

  const nome = new TextInputBuilder()
    .setCustomId("nome")
    .setLabel("Nome do curso")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex: CFC")
    .setRequired(true);

  const data = new TextInputBuilder()
    .setCustomId("data")
    .setLabel("Data do curso")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex: 25/06/2026")
    .setRequired(true);

  const horario = new TextInputBuilder()
    .setCustomId("horario")
    .setLabel("Horário do curso")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex: 20:00")
    .setRequired(true);

  const instrutor = new TextInputBuilder()
    .setCustomId("instrutor")
    .setLabel("Instrutor responsável")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex: Tenente Aguiar")
    .setRequired(true);

  const vagas = new TextInputBuilder()
    .setCustomId("vagas")
    .setLabel("Quantidade de vagas")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex: 30")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(data),
    new ActionRowBuilder().addComponents(horario),
    new ActionRowBuilder().addComponents(instrutor),
    new ActionRowBuilder().addComponents(vagas)
  );

  return modal;
}

function modalAvisoPersonalizado() {
  const modal = new ModalBuilder()
    .setCustomId("pmce_modal_aviso_personalizado")
    .setTitle("Aviso Personalizado");

  const mensagem = new TextInputBuilder()
    .setCustomId("mensagem")
    .setLabel("Mensagem para os inscritos")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Ex: Curso começa em 15 minutos. Compareçam ao Discord.")
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(mensagem));

  return modal;
}
async function enviarAvisoPadrao(interaction) {
  const curso = dbCursos.cursoAtivo;

  if (!curso) {
    return interaction.reply({
      content: "❌ Nenhum curso ativo.",
      ephemeral: true,
    });
  }

  let enviados = 0;
  let falhas = 0;

  for (const userId of curso.inscritos) {
    try {
      const user = await interaction.client.users.fetch(userId);

      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎓 AVISO DE CURSO PMCE")
            .setColor("Blue")
            .setDescription(
              [
                "Você está inscrito no curso:",
                "",
                `📚 ${curso.nome}`,
                `📅 ${curso.data}`,
                `⏰ ${curso.horario}`,
                "",
                "Sua presença é obrigatória.",
              ].join("\n")
            ),
        ],
      });

      enviados++;
    } catch {
      falhas++;
    }
  }

  await interaction.reply({
    content: `✅ Aviso enviado para ${enviados} inscritos.\n⚠️ Falhas: ${falhas}`,
    ephemeral: true,
  });
}

function registrarCursoPMCE(client) {

  client.on("interactionCreate", async (interaction) => {

    try {

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "curso"
      ) {

        return interaction.reply({
          embeds: [painelAdminCurso()],
          components: [botoesAdminCurso()],
          ephemeral: true,
        });
      }

      if (interaction.isButton()) {

        if (interaction.customId === "pmce_curso_abrir") {
          return interaction.showModal(modalAbrirCurso());
        }

        if (interaction.customId === "pmce_curso_aviso") {
          return enviarAvisoPadrao(interaction);
        }

        if (interaction.customId === "pmce_curso_aviso_personalizado") {
          return interaction.showModal(
            modalAvisoPersonalizado()
          );
        }

        if (interaction.customId === "pmce_curso_lista") {

          if (!dbCursos.cursoAtivo) {
            return interaction.reply({
              content: "❌ Nenhum curso ativo.",
              ephemeral: true,
            });
          }

          const inscritos =
            dbCursos.cursoAtivo.inscritos.length
              ? dbCursos.cursoAtivo.inscritos
                  .map((id) => `<@${id}>`)
                  .join("\n")
              : "Nenhum inscrito.";

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("📋 Lista de Inscritos")
                .setColor("Blue")
                .setDescription(inscritos),
            ],
            ephemeral: true,
          });
        }

        if (interaction.customId === "pmce_curso_fechar") {

          if (!dbCursos.cursoAtivo) {
            return interaction.reply({
              content: "❌ Nenhum curso ativo.",
              ephemeral: true,
            });
          }

          dbCursos.cursoAtivo.aberto = false;
          salvarCursos();

          return interaction.reply({
            content: "🔒 Curso encerrado.",
            ephemeral: true,
          });
        }

        if (interaction.customId === "pmce_curso_inscrever") {

          const curso = dbCursos.cursoAtivo;

          if (!curso || !curso.aberto) {
            return interaction.reply({
              content: "❌ Curso indisponível.",
              ephemeral: true,
            });
          }

          if (curso.inscritos.includes(interaction.user.id)) {
            return interaction.reply({
              content: "❌ Você já está inscrito.",
              ephemeral: true,
            });
          }

          if (curso.inscritos.length >= curso.vagas) {
            return interaction.reply({
              content: "❌ Todas as vagas foram preenchidas.",
              ephemeral: true,
            });
          }

          curso.inscritos.push(interaction.user.id);
          salvarCursos();

          return interaction.reply({
            content:
              "✅ Inscrição realizada com sucesso.\n\nAo se inscrever você assume o compromisso de comparecer ao curso.",
            ephemeral: true,
          });
        }
      }

      if (interaction.isModalSubmit()) {

        if (
          interaction.customId ===
          "pmce_modal_abrir_curso"
        ) {

          const nome =
            interaction.fields.getTextInputValue(
              "nome"
            );

          const data =
            interaction.fields.getTextInputValue(
              "data"
            );

          const horario =
            interaction.fields.getTextInputValue(
              "horario"
            );

          const instrutor =
            interaction.fields.getTextInputValue(
              "instrutor"
            );

          const vagas = parseInt(
            interaction.fields.getTextInputValue(
              "vagas"
            )
          );

          dbCursos.cursoAtivo = {
            nome,
            data,
            horario,
            instrutor,
            vagas,
            aberto: true,
            inscritos: [],
          };

          salvarCursos();

          const canal = await interaction.guild.channels
            .fetch(process.env.PMCE_CURSOS_CHANNEL)
            .catch(() => null);

          if (canal) {
            await canal.send({
              embeds: [embedCursoPublico()],
              components: [botoesCursoPublico()],
            });
          }

          return interaction.reply({
            content:
              "✅ Curso criado com sucesso.",
            ephemeral: true,
          });
        }

        if (
          interaction.customId ===
          "pmce_modal_aviso_personalizado"
        ) {

          const mensagem =
            interaction.fields.getTextInputValue(
              "mensagem"
            );

          const curso = dbCursos.cursoAtivo;

          if (!curso) {
            return interaction.reply({
              content: "❌ Nenhum curso ativo.",
              ephemeral: true,
            });
          }

          let enviados = 0;
          let falhas = 0;

          for (const userId of curso.inscritos) {

            try {

              const user =
                await interaction.client.users.fetch(
                  userId
                );

              await user.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("🎓 AVISO PMCE")
                    .setColor("Blue")
                    .setDescription(mensagem),
                ],
              });

              enviados++;

            } catch {
              falhas++;
            }
          }

          return interaction.reply({
            content:
              `✅ Aviso enviado para ${enviados} inscritos.\n` +
              `⚠️ Falhas: ${falhas}`,
            ephemeral: true,
          });
        }
      }

    } catch (error) {
      console.error(
        "ERRO SISTEMA CURSO PMCE:",
        error
      );
    }
  });
}

module.exports = {
  registrarCursoPMCE,
  cursoPMCECommand,
};