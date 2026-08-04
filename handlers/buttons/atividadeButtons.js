const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const CARGO_POLICIA_MILITAR_ID =
  "1141776608387149924";

const ITENS_POR_PAGINA = 10;

function criarDescricao(
  membros,
  pagina
) {
  const inicio =
    pagina * ITENS_POR_PAGINA;

  const membrosPagina = membros.slice(
    inicio,
    inicio + ITENS_POR_PAGINA
  );

  return (
    membrosPagina
      .map((dados, index) => {
        const posicao =
          inicio + index + 1;

        if (!dados.lastPatrolAt) {
          return `**${posicao}.** ⚫ <@${dados.id}> — Nunca participou`;
        }

        const diferenca = Math.max(
          0,
          Date.now() -
            dados.lastPatrolAt
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
      .join("\n") ||
    "Nenhum policial nesta página."
  );
}

function criarEmbed(
  membros,
  pagina,
  totalPaginas
) {
  return new EmbedBuilder()
    .setTitle(
      "📋 Atividade Operacional"
    )
    .setColor("Blue")
    .setDescription(
      criarDescricao(
        membros,
        pagina
      )
    )
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
}

function criarBotoes(
  pagina,
  totalPaginas
) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `atividade_anterior_${pagina}`
        )
        .setEmoji("⬅️")
        .setStyle(
          ButtonStyle.Secondary
        )
        .setDisabled(pagina === 0),

      new ButtonBuilder()
        .setCustomId(
          `atividade_proximo_${pagina}`
        )
        .setEmoji("➡️")
        .setStyle(
          ButtonStyle.Secondary
        )
        .setDisabled(
          pagina >= totalPaginas - 1
        )
    );
}

module.exports =
  async function handleAtividadeButtons(
    interaction,
    context
  ) {
    if (!interaction.isButton()) {
      return false;
    }

    const ehBotaoAtividade =
      interaction.customId.startsWith(
        "atividade_anterior_"
      ) ||
      interaction.customId.startsWith(
        "atividade_proximo_"
      );

    if (!ehBotaoAtividade) {
      return false;
    }

    const { db } = context;

    await interaction.deferUpdate();

    try {
      const partes =
        interaction.customId.split("_");

      let paginaAtual =
        Number.parseInt(
          partes[2],
          10
        );

      if (
        Number.isNaN(paginaAtual)
      ) {
        paginaAtual = 0;
      }

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
          const dados =
            db.membros?.[member.id] ||
            {};

          return {
            id: member.id,
            lastPatrolAt:
              Number(
                dados.lastPatrolAt
              ) || null,
          };
        })
        .sort((a, b) => {
          if (
            a.lastPatrolAt &&
            !b.lastPatrolAt
          ) {
            return -1;
          }

          if (
            !a.lastPatrolAt &&
            b.lastPatrolAt
          ) {
            return 1;
          }

          return (
            (b.lastPatrolAt || 0) -
            (a.lastPatrolAt || 0)
          );
        });

      if (!membros.length) {
        await interaction.editReply({
          content:
            "❌ Nenhum membro possui o cargo de Polícia Militar.",
          embeds: [],
          components: [],
        });

        return true;
      }

      const totalPaginas = Math.max(
        1,
        Math.ceil(
          membros.length /
            ITENS_POR_PAGINA
        )
      );

      let novaPagina =
        paginaAtual;

      if (
        interaction.customId.startsWith(
          "atividade_proximo_"
        )
      ) {
        novaPagina++;
      }

      if (
        interaction.customId.startsWith(
          "atividade_anterior_"
        )
      ) {
        novaPagina--;
      }

      novaPagina = Math.max(
        0,
        Math.min(
          novaPagina,
          totalPaginas - 1
        )
      );

      const embed = criarEmbed(
        membros,
        novaPagina,
        totalPaginas
      );

      const botoes = criarBotoes(
        novaPagina,
        totalPaginas
      );

      await interaction.editReply({
        content: null,
        embeds: [embed],
        components:
          totalPaginas > 1
            ? [botoes]
            : [],
      });

      return true;
    } catch (error) {
      console.error(
        "Erro na paginação de /atividade:",
        error
      );

      await interaction
        .followUp({
          content:
            "❌ Não foi possível trocar a página.",
          ephemeral: true,
        })
        .catch(() => null);

      return true;
    }
  };