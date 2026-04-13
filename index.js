require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const DB_FILE = path.join(__dirname, "db.json");

function loadDb() {
  const initial = { viaturas: {}, membros: {}, historico: [] };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    if (!data.viaturas) data.viaturas = {};
    if (!data.membros) data.membros = {};
    if (!data.historico) data.historico = [];

    return data;
  } catch (error) {
    console.error("Erro ao ler db.json:", error);
    return initial;
  }
}

const db = loadDb();

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function ensureMember(id) {
  if (!db.membros) db.membros = {};

  if (!db.membros[id]) {
    db.membros[id] = {
      prisoes: 0,
      ocorrencias: 0,
      dinheiro: 0,
      tempo: 0,
      pontos: 0,
    };
  }

  return db.membros[id];
}

function logAction(userId, tipo, valor = 1) {
  db.historico.push({
    userId,
    tipo,
    valor,
    data: Date.now(),
  });
}

function getPeriodoDias(dias) {
  const agora = Date.now();
  return db.historico.filter((item) => agora - item.data <= dias * 86400000);
}

function calcularStats(lista) {
  const stats = {};

  for (const item of lista) {
    if (!stats[item.userId]) {
      stats[item.userId] = {
        tempo: 0,
        prisoes: 0,
        ocorrencias: 0,
        dinheiro: 0,
        pontos: 0,
      };
    }

    if (item.tipo === "tempo") {
      stats[item.userId].tempo += item.valor;
      stats[item.userId].pontos += Math.floor(item.valor);
    }

    if (item.tipo === "prisao") {
      stats[item.userId].prisoes += item.valor;
      stats[item.userId].pontos += item.valor * 10;
    }

    if (item.tipo === "ocorrencia") {
      stats[item.userId].ocorrencias += item.valor;
      stats[item.userId].pontos += item.valor * 5;
    }

    if (item.tipo === "dinheiro") {
      stats[item.userId].dinheiro += item.valor;
      stats[item.userId].pontos += Math.floor(item.valor / 1000);
    }
  }

  return stats;
}

function rankingEmbed(stats, titulo) {
  const ranking = Object.entries(stats)
    .sort((a, b) => b[1].pontos - a[1].pontos)
    .slice(0, 10);

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setColor("Gold")
    .setTimestamp();

  if (!ranking.length) {
    embed.setDescription("Sem dados no momento.");
    return embed;
  }

  embed.setDescription(
    ranking
      .map(([userId, dados], index) => {
        return [
          `**${index + 1}.** <@${userId}>`,
          `⏱️ ${dados.tempo.toFixed(1)} min`,
          `🚔 ${dados.prisoes} prisões`,
          `📦 ${dados.ocorrencias} ocorrências`,
          `💰 R$${dados.dinheiro}`,
          `🏆 ${dados.pontos} pts`,
        ].join(" | ");
      })
      .join("\n")
  );

  return embed;
}

function ensureViatura(nome) {
  const nomeFormatado = nome.toUpperCase().trim();

  if (!db.viaturas[nomeFormatado]) {
    db.viaturas[nomeFormatado] = {
      membros: [],
      lider: null,
      inicio: null,
      prisoes: 0,
      dinheiro: 0,
      ocorrencias: 0,
    };
  }

  return db.viaturas[nomeFormatado];
}

function formatEquipe(membros) {
  if (!membros.length) return "Nenhum membro na viatura.";
  return membros.map((id, i) => `P${i + 1}: <@${id}>`).join("\n");
}

function buildPainelContent(nome) {
  const v = ensureViatura(nome);
  const lider = v.lider ? `<@${v.lider}>` : "Nenhum";
  const equipe = formatEquipe(v.membros);

  return [
    `🚓 **Viatura ${nome.toUpperCase()}**`,
    `⭐ **Líder:** ${lider}`,
    `👮 **Equipe:**`,
    equipe,
    "",
    `🚔 **Prisões:** ${v.prisoes}`,
    `📦 **Ocorrências:** ${v.ocorrencias}`,
    `💰 **Dinheiro:** R$${v.dinheiro}`,
  ].join("\n");
}

function buildButtons(nome) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`entrar:${nome}`)
      .setLabel("Entrar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`lider:${nome}`)
      .setLabel("Líder")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`sair:${nome}`)
      .setLabel("Sair")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`finalizar:${nome}`)
      .setLabel("Finalizar")
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prisao:${nome}`)
      .setLabel("Prisão")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`ocorrencia:${nome}`)
      .setLabel("Ocorrência")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dinheiro:${nome}`)
      .setLabel("Apreender")
      .setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}

function registrarParaTodaViatura(membros, tipo, valor) {
  for (const membroId of membros) {
    const m = ensureMember(membroId);

    if (tipo === "prisao") {
      m.prisoes += valor;
      m.pontos += valor * 10;
    }

    if (tipo === "ocorrencia") {
      m.ocorrencias += valor;
      m.pontos += valor * 5;
    }

    if (tipo === "dinheiro") {
      m.dinheiro += valor;
      m.pontos += Math.floor(valor / 1000);
    }

    if (tipo === "tempo") {
      m.tempo += valor;
      m.pontos += Math.floor(valor);
    }

    logAction(membroId, tipo, valor);
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName("viatura")
    .setDescription("Abrir painel da viatura")
    .addStringOption((option) =>
      option
        .setName("nome")
        .setDescription("Nome da viatura (ex: VTR01)")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Ver ranking geral dos policiais"),

  new SlashCommandBuilder()
    .setName("rankingsemanal")
    .setDescription("Ver ranking semanal"),

  new SlashCommandBuilder()
    .setName("rankingmensal")
    .setDescription("Ver ranking mensal"),

  new SlashCommandBuilder()
    .setName("meurank")
    .setDescription("Ver seu desempenho individual"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  try {
    console.log(`BOT ONLINE: ${client.user.tag}`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("COMANDOS REGISTRADOS");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "viatura") {
        await interaction.deferReply();

        const nome = interaction.options.getString("nome");
        ensureViatura(nome);
        saveDb();

        return await interaction.editReply({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (interaction.commandName === "ranking") {
        return await interaction.reply({
          embeds: [rankingEmbed(calcularStats(db.historico), "🏆 Ranking Geral")],
        });
      }

      if (interaction.commandName === "rankingsemanal") {
        const stats = calcularStats(getPeriodoDias(7));
        return await interaction.reply({
          embeds: [rankingEmbed(stats, "📊 Ranking Semanal")],
        });
      }

      if (interaction.commandName === "rankingmensal") {
        const stats = calcularStats(getPeriodoDias(30));
        return await interaction.reply({
          embeds: [rankingEmbed(stats, "📊 Ranking Mensal")],
        });
      }

      if (interaction.commandName === "meurank") {
        const m = ensureMember(interaction.user.id);

        const embed = new EmbedBuilder()
          .setTitle("📋 Seu Desempenho Geral")
          .setColor("Blue")
          .addFields(
            { name: "⏱️ Tempo", value: `${m.tempo.toFixed(1)} min`, inline: true },
            { name: "🚔 Prisões", value: String(m.prisoes), inline: true },
            { name: "📦 Ocorrências", value: String(m.ocorrencias), inline: true },
            { name: "💰 Dinheiro", value: `R$${m.dinheiro}`, inline: true },
            { name: "🏆 Pontos", value: String(m.pontos), inline: true }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      return;
    }

    if (interaction.isButton()) {
      const [tipo, nomeRaw] = interaction.customId.split(":");
      const nome = nomeRaw.toUpperCase().trim();
      const v = ensureViatura(nome);
      const id = interaction.user.id;

      if (tipo === "entrar") {
        if (!v.membros.includes(id) && v.membros.length < 4) {
          v.membros.push(id);
          if (!v.inicio) v.inicio = Date.now();
          if (!v.lider) v.lider = id;
          saveDb();
        }

        return await interaction.update({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (tipo === "lider") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você precisa estar na viatura para virar líder.",
            ephemeral: true,
          });
        }

        v.lider = id;
        saveDb();

        return await interaction.update({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (tipo === "sair") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você não está nessa viatura.",
            ephemeral: true,
          });
        }

        v.membros = v.membros.filter((u) => u !== id);

        if (v.lider === id) {
          v.lider = v.membros[0] || null;
        }

        if (v.membros.length === 0) {
          v.inicio = null;
          v.prisoes = 0;
          v.ocorrencias = 0;
          v.dinheiro = 0;
        }

        saveDb();

        return await interaction.update({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (tipo === "prisao") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você precisa estar na viatura para registrar prisão.",
            ephemeral: true,
          });
        }

        v.prisoes += 1;
        registrarParaTodaViatura(v.membros, "prisao", 1);
        saveDb();

        return await interaction.update({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (tipo === "ocorrencia") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você precisa estar na viatura para registrar ocorrência.",
            ephemeral: true,
          });
        }

        v.ocorrencias += 1;
        registrarParaTodaViatura(v.membros, "ocorrencia", 1);
        saveDb();

        return await interaction.update({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
      }

      if (tipo === "dinheiro") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você precisa estar na viatura para registrar apreensão.",
            ephemeral: true,
          });
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

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return await interaction.showModal(modal);
      }

      if (tipo === "finalizar") {
        if (!v.membros.includes(id)) {
          return await interaction.reply({
            content: "❌ Você precisa estar na viatura para finalizar.",
            ephemeral: true,
          });
        }

        const lider = v.lider ? `<@${v.lider}>` : "Nenhum";
        const equipe = formatEquipe(v.membros);
        const tempoMin = v.inicio
          ? ((Date.now() - v.inicio) / 60000).toFixed(1)
          : "0.0";

        registrarParaTodaViatura(v.membros, "tempo", Number(tempoMin));

        const embed = new EmbedBuilder()
          .setTitle(`🚔 RELATÓRIO FINAL - ${nome}`)
          .setColor("Red")
          .addFields(
            { name: "⭐ Líder", value: lider, inline: false },
            { name: "👮 Equipe", value: equipe, inline: false },
            { name: "⏱️ Tempo", value: `${tempoMin} min`, inline: true },
            { name: "🚔 Prisões", value: String(v.prisoes), inline: true },
            { name: "📦 Ocorrências", value: String(v.ocorrencias), inline: true },
            { name: "💰 Dinheiro", value: `R$${v.dinheiro}`, inline: true }
          )
          .setTimestamp();

        try {
          const canal = await client.channels.fetch(process.env.LOG_CHANNEL);
          if (canal) {
            await canal.send({ embeds: [embed] });
          }
        } catch (error) {
          console.error("Erro ao enviar log:", error);
        }

        db.viaturas[nome] = {
          membros: [],
          lider: null,
          inicio: null,
          prisoes: 0,
          dinheiro: 0,
          ocorrencias: 0,
        };

        saveDb();

        return await interaction.update({
          content: "✅ Patrulha finalizada.",
          embeds: [embed],
          components: [],
        });
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      const [, nomeRaw] = interaction.customId.split(":");
      const nome = nomeRaw.toUpperCase().trim();
      const valorTexto = interaction.fields.getTextInputValue("valor");
      const valor = parseInt(valorTexto, 10);

      if (Number.isNaN(valor) || valor <= 0) {
        return await interaction.reply({
          content: "❌ Digite um valor válido.",
          ephemeral: true,
        });
      }

      const v = ensureViatura(nome);
      const id = interaction.user.id;

      if (!v.membros.includes(id)) {
        return await interaction.reply({
          content: "❌ Você precisa estar na viatura para registrar apreensão.",
          ephemeral: true,
        });
      }

      v.dinheiro += valor;
      registrarParaTodaViatura(v.membros, "dinheiro", valor);
      saveDb();

      return await interaction.reply({
        content: `💰 R$${valor} registrado na viatura ${nome}.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Erro geral na interação:");
    console.error(error);
    console.error(error?.stack);

    if (!interaction.isRepliable()) return;

    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao processar a interação.",
          ephemeral: true,
        });
      }
    } catch (e) {
      console.error("Erro ao responder a interação:", e);
    }
  }
});

client.login(process.env.TOKEN);