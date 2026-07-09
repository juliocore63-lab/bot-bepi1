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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const { registrarEditalPMCE, editalPMCECommand } = require("./editalpmce");
const { registrarCursoPMCE, cursoPMCECommand } = require("./cursoPMCE");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

registrarEditalPMCE(client);
registrarCursoPMCE(client);

const DB_FILE = path.join(__dirname, "db.json");

function loadDb() {
  const initial = {
    viaturas: {},
    membros: {},
    historico: [],
  };

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

function formatMinutes(min) {
  const horas = Math.floor(min / 60);
  const minutos = Math.floor(min % 60);

  return `${horas.toString().padStart(2, "0")}h ${minutos
    .toString()
    .padStart(2, "0")}min`;
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
      weeklyTime: 0,
      lastPatrolAt: null,
      patrolStart: null,
      lastWeeklyReset: Date.now(),
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

function ensureViatura(nome) {
  const nomeFormatado = nome.toUpperCase().trim();

  if (!db.viaturas[nomeFormatado]) {
    db.viaturas[nomeFormatado] = {
      membros: [],
      entrada: {},
      lider: null,
      inicio: null,
      prisoes: 0,
      dinheiro: 0,
      ocorrencias: 0,
      tempoIndividual: {},
      historicoEntradas: [],
      historicoSaidas: [],
    };
  }

  const v = db.viaturas[nomeFormatado];

  if (!v.entrada) v.entrada = {};
  if (!v.tempoIndividual) v.tempoIndividual = {};
  if (!v.historicoEntradas) v.historicoEntradas = [];
  if (!v.historicoSaidas) v.historicoSaidas = [];

  return v;
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

function registrarEntrada(v, userId) {
  if (!v.entrada[userId]) {
    v.entrada[userId] = Date.now();

    v.historicoEntradas.push({
      userId,
      data: Date.now(),
    });
  }
}

function registrarSaida(v, userId) {
  const entrouEm = v.entrada?.[userId];
  if (!entrouEm) return 0;

  const tempoMin = (Date.now() - entrouEm) / 60000;

  if (!v.tempoIndividual[userId]) {
    v.tempoIndividual[userId] = 0;
  }

  v.tempoIndividual[userId] += tempoMin;

  const m = ensureMember(userId);
  m.tempo += tempoMin;
  m.pontos += Math.floor(tempoMin);
  m.lastPatrolAt = Date.now();

  if (m.patrolStart) {
    const tempoSemanal = (Date.now() - m.patrolStart) / 60000;
    m.weeklyTime += tempoSemanal;
    m.patrolStart = null;
  }

  logAction(userId, "tempo", tempoMin);

  v.historicoSaidas.push({
    userId,
    data: Date.now(),
    tempo: tempoMin,
  });

  delete v.entrada[userId];

  return tempoMin;
}

function formatTempoIndividual(v, equipeFinal) {
  if (!equipeFinal.length) return "Nenhum tempo registrado.";

  return equipeFinal
    .map((membroId, index) => {
      const tempo = v.tempoIndividual?.[membroId] || 0;
      return `P${index + 1}: <@${membroId}> — ${tempo.toFixed(1)} min`;
    })
    .join("\n");
}

function formatHistoricoEntradas(v) {
  if (!v.historicoEntradas?.length) return "Ninguém entrou.";

  return v.historicoEntradas
    .map((item, index) => `E${index + 1}: <@${item.userId}>`)
    .join("\n");
}

function formatHistoricoSaidas(v) {
  if (!v.historicoSaidas?.length) return "Ninguém saiu antes do encerramento.";

  return v.historicoSaidas
    .map(
      (item, index) =>
        `S${index + 1}: <@${item.userId}> — ${item.tempo.toFixed(1)} min`
    )
    .join("\n");
}

function buildRankingPages(stats, titulo) {
  const ranking = Object.entries(stats).sort(
    (a, b) => b[1].pontos - a[1].pontos
  );

  if (!ranking.length) {
    return [
      new EmbedBuilder()
        .setTitle(titulo)
        .setColor("Gold")
        .setDescription("Sem dados no momento.")
        .setTimestamp(),
    ];
  }

  const pageSize = 10;
  const pages = [];

  for (let i = 0; i < ranking.length; i += pageSize) {
    const chunk = ranking.slice(i, i + pageSize);

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setColor("Gold")
      .setDescription(
        chunk
          .map(([userId, dados], index) => {
            const pos = i + index + 1;

            return [
              `**${pos}.** <@${userId}>`,
              `⏱️ ${dados.tempo.toFixed(1)} min`,
              `🚔 ${dados.prisoes} prisões`,
              `📦 ${dados.ocorrencias} ocorrências`,
              `💰 R$${dados.dinheiro}`,
              `🏆 ${dados.pontos} pts`,
            ].join(" | ");
          })
          .join("\n")
      )
      .setFooter({
        text: `Página ${Math.floor(i / pageSize) + 1} de ${Math.ceil(
          ranking.length / pageSize
        )}`,
      })
      .setTimestamp();

    pages.push(embed);
  }

  return pages;
}

function buildRankingButtons(tipo, page, totalPages) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rank_prev:${tipo}:${page}`)
        .setLabel("⬅️ Anterior")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 0),
      new ButtonBuilder()
        .setCustomId(`rank_info:${tipo}:${page}`)
        .setLabel(`Página ${page + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`rank_next:${tipo}:${page}`)
        .setLabel("Próxima ➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1)
    ),
  ];
}

function getRankingData(tipo) {
  if (tipo === "geral") {
    return {
      titulo: "🏆 Ranking Geral",
      stats: calcularStats(db.historico),
    };
  }

  if (tipo === "semanal") {
    return {
      titulo: "📊 Ranking Semanal",
      stats: calcularStats(getPeriodoDias(7)),
    };
  }

  if (tipo === "mensal") {
    return {
      titulo: "📊 Ranking Mensal",
      stats: calcularStats(getPeriodoDias(30)),
    };
  }

  return {
    titulo: "Ranking",
    stats: {},
  };
}

function formatarMembrosCargo(guild, cargoInfo) {
  const cargo = guild.roles.cache.get(cargoInfo.id);

  if (!cargo) {
    return "⚠️ Cargo não encontrado pelo ID.";
  }

  const membros = guild.members.cache.filter((membro) =>
    membro.roles.cache.has(cargo.id)
  );

  if (!membros.size) {
    return "Nenhum membro possui esse cargo atualmente.";
  }

  return membros.map((membro) => `• <@${membro.id}>`).join("\n");
}

function montarEmbedHierarquia(guild, grupo) {
  let descricao = "";

  for (const cargoInfo of grupo.cargos) {
    descricao += `\n**☠️ @${cargoInfo.nome}**\n`;

    const cargo = guild.roles.cache.get(cargoInfo.id);

    if (!cargo) {
      descricao += "⚠️ Cargo não encontrado pelo ID.\n\n";
      continue;
    }

    const membros = guild.members.cache.filter((membro) =>
      membro.roles.cache.has(cargo.id)
    );

    descricao += `${membros.size} membros\n\n`;
    descricao += formatarMembrosCargo(guild, cargoInfo);
    descricao += "\n\n";
  }

  return new EmbedBuilder()
    .setTitle(grupo.titulo)
    .setColor(grupo.cor || "Purple")
    .setDescription(descricao || "Nenhum cargo configurado.")
    .setTimestamp();
}

const gruposHierarquia = [
  {
    titulo: "⭐ Alto Comando & Oficiais ⭐",
    cor: "Purple",
    cargos: [
      { nome: "BR ¦ Aposentado", id: "1505273752462688476" },
      { nome: "BR ¦ Coronel ⭐ ⭐ ⭐", id: "1141776577328324669" },
      { nome: "BR ¦ Tenente Coronel ✪ ✪ ★", id: "1141776588749418626" },
      { nome: "BR ¦ Major ✪ ★ ★", id: "1141776589605060618" },
      { nome: "BR ¦ Capitão ★ ★ ★", id: "1141776591496679504" },
    ],
  },
  {
    titulo: "💠 Oficiais Subalternos & Graduados 💠",
    cor: "Purple",
    cargos: [
      { nome: "BR ¦ 1º Tenente ★★", id: "1141776594420105287" },
      { nome: "BR ¦ 2º Tenente ★", id: "1141776596257226803" },
      { nome: "BR ¦ Aspirante a Oficial ✪ ✪ ✪", id: "1141776586740350978" },
      { nome: "BR ¦ Sub-Tenente ★", id: "1498676034328068187" },
      { nome: "BR ¦ 1º Sargento .", id: "1141776600598335582" },
      { nome: "BR ¦ 2º Sargento .", id: "1141776601701433414" },
      { nome: "BR ¦ 3º Sargento .", id: "1141776602703867914" },
    ],
  },
  {
    titulo: "---Praças---",
    cor: "Purple",
    cargos: [
      { nome: "BR ¦ Cabo ︽.", id: "1141776603949580349" },
      { nome: "BR ¦ Soldado ︿.", id: "1141776605123977327" },
      { nome: "BR ¦ Recruta ︿.", id: "1465100597152841892" },
    ],
  },
];

const gruposHierarquia2 = [
  {
    titulo: "👑 Hierarquia COTAR",
    cor: "Yellow",
    cargos: [
      { nome: "💀・COMANDO COTAR ・💀", id: "1482090447500214463" },
      { nome: "💀・SUB-COMANDO COTAR ・💀", id: "1482092770184269885" },
      { nome: "💀・Instrutor Cotar ・💀", id: "1484975335929024702" },
      { nome: "💀・MEMBRO COTAR・💀", id: "1506761175193489568" },
    ],
  },
];

// att

const commands = [
  editalPMCECommand,
  cursoPMCECommand,
  
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
  new SlashCommandBuilder()
    .setName("atividade")
    .setDescription("Ver atividade operacional"),
  new SlashCommandBuilder()
    .setName("tempo")
    .setDescription("Ver tempo semanal"),
  new SlashCommandBuilder()
  .setName("removertempo")
  .setDescription("Remover tempo de patrulha de um policial")
  .addUserOption((option) =>
    option
      .setName("usuario")
      .setDescription("Policial que terá o tempo removido")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("minutos")
      .setDescription("Quantidade de minutos para remover")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("motivo")
      .setDescription("Motivo da remoção")
      .setRequired(false)
  ),
  new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Ver hierarquia operacional"),
  new SlashCommandBuilder()
    .setName("hierarquia2")
    .setDescription("Ver segunda hierarquia"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  try {
    console.log(`BOT ONLINE: ${client.user.tag}`);

    const guilds = [
  process.env.GUILD_ID_1,
  process.env.GUILD_ID_2,
].filter(Boolean);

if (guilds.length) {
  for (const guildId of guilds) {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        guildId
      ),
      { body: commands }
    );

    console.log(`✅ Comandos registrados no servidor ${guildId}`);
  }
} else {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Comandos globais registrados");
}

    console.log("COMANDOS REGISTRADOS");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

function buildConfirmarParticipantes(nome, v) {
  const participantes =
    v.confirmacao?.participantes || [...v.membros];

  const select = new StringSelectMenuBuilder()
    .setCustomId(`confirm_participantes:${nome}`)
    .setPlaceholder("Selecione quem realmente participou")
    .setMinValues(1)
    .setMaxValues(v.membros.length)
    .addOptions(
      v.membros.map((membroId, index) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`P${index + 1}`)
          .setDescription(`Membro ${index + 1} da viatura`)
          .setValue(membroId)
          .setDefault(participantes.includes(membroId))
      )
    );

  const rowSelect = new ActionRowBuilder().addComponents(select);

  const rowButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_finalizar:${nome}`)
      .setLabel("Confirmar fechamento")
      .setStyle(ButtonStyle.Danger)
  );

  return [rowSelect, rowButton];
}

client.on("interactionCreate", async (interaction) => {
  try {

    if (interaction.isStringSelectMenu()) {
  if (interaction.customId.startsWith("confirm_participantes:")) {
    const [, nomeRaw] = interaction.customId.split(":");
    const nome = nomeRaw.toUpperCase().trim();
    const v = ensureViatura(nome);

    if (v.lider !== interaction.user.id) {
      return await interaction.reply({
        content: "❌ Apenas o líder da viatura pode alterar os participantes.",
        ephemeral: true,
      });
    }

    v.confirmacao.participantes = interaction.values;

    saveDb();

    return await interaction.update({
      content:
        `🚓 **Confirmar participantes da viatura ${nome}**\n\n` +
        `Participantes confirmados: ${interaction.values
          .map((id) => `<@${id}>`)
          .join(", ")}`,
      components: buildConfirmarParticipantes(nome, v),
    });
  }
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

        const nome = interaction.options.getString("nome");

        ensureViatura(nome);

        saveDb();

        return await interaction.editReply({
          content: buildPainelContent(nome),
          components: buildButtons(nome),
        });
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
          Object.entries(db.membros)
            .sort(
              (a, b) =>
                (b[1]
                  .weeklyTime || 0) -
                (a[1]
                  .weeklyTime || 0)
            )
            .slice(0, 20);

        const descricao =
          membros
            .map(([id, dados]) => {

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
    if (interaction.isButton()) {

      if (interaction.customId.startsWith("confirm_finalizar:")) {

  const [, nomeRaw] = interaction.customId.split(":");
  const nome = nomeRaw.toUpperCase().trim();

  const v = ensureViatura(nome);

  if (v.lider !== interaction.user.id) {
    return await interaction.reply({
      content: "❌ Apenas o líder da viatura pode confirmar o fechamento.",
      ephemeral: true,
    });
  }

  const participantes =
    v.confirmacao?.participantes || [...v.membros];

  return await interaction.reply({
    content:
      "✅ Participantes confirmados:\n\n" +
      participantes.map((id) => `<@${id}>`).join("\n") +
      "\n\n⚠️ Agora me avise para fazermos a última etapa da finalização.",
    ephemeral: true,
  });
}

    if (interaction.customId.startsWith("pmce_")) {
      return;
    }

      // =========================
      // PAGINAÇÃO RANK
      // =========================
      if (
        interaction.customId.startsWith(
          "rank_prev:"
        ) ||
        interaction.customId.startsWith(
          "rank_next:"
        )
      ) {

        const [
          acao,
          tipo,
          pageStr,
        ] =
          interaction.customId.split(
            ":"
          );

        let page =
          parseInt(pageStr);

        if (acao === "rank_prev")
          page--;

        if (acao === "rank_next")
          page++;

        const { titulo, stats } =
          getRankingData(tipo);

        const pages =
          buildRankingPages(stats, titulo);

        if (page < 0)
          page = 0;

        if (page >= pages.length)
          page = pages.length - 1;

        return await interaction.update({
          embeds: [pages[page]],
          components:
            buildRankingButtons(
              tipo,
              page,
              pages.length
            ),
        });
      }

      // =========================
      // BOTÃO INFO RANK
      // =========================
      if (
        interaction.customId.startsWith(
          "rank_info:"
        )
      ) {
        return await interaction.deferUpdate();
      }

      const [
        tipo,
        nomeRaw,
      ] =
        interaction.customId.split(
          ":"
        );

      const nome =
        nomeRaw
          .toUpperCase()
          .trim();

      const v =
        ensureViatura(nome);

      const id =
        interaction.user.id;

      // =========================
      // ENTRAR
      // =========================
      if (tipo === "entrar") {

        if (
          !v.membros.includes(id) &&
          v.membros.length < 4
        ) {

          v.membros.push(id);

          registrarEntrada(v, id);

          const membro =
            ensureMember(id);

          membro.lastPatrolAt =
            Date.now();

          membro.patrolStart =
            Date.now();

          if (!v.inicio)
            v.inicio = Date.now();

          if (!v.lider)
            v.lider = id;

          saveDb();
        }

        return await interaction.update({
          content:
            buildPainelContent(
              nome
            ),
          components:
            buildButtons(nome),
        });
      }

      // =========================
      // LÍDER
      // =========================
      if (tipo === "lider") {

        if (
          !v.membros.includes(id)
        ) {
          return await interaction.reply({
            content:
              "❌ Você precisa estar na viatura.",
            ephemeral: true,
          });
        }

        v.lider = id;

        saveDb();

        return await interaction.update({
          content:
            buildPainelContent(
              nome
            ),
          components:
            buildButtons(nome),
        });
      }

      // =========================
      // SAIR
      // =========================
      if (tipo === "sair") {

        if (
          !v.membros.includes(id)
        ) {
          return await interaction.reply({
            content:
              "❌ Você não está nessa viatura.",
            ephemeral: true,
          });
        }

        registrarSaida(v, id);

        v.membros =
          v.membros.filter(
            (u) => u !== id
          );

        if (v.lider === id) {
          v.lider =
            v.membros[0] || null;
        }

        if (
          v.membros.length === 0
        ) {
          v.inicio = null;
          v.prisoes = 0;
          v.ocorrencias = 0;
          v.dinheiro = 0;
          v.entrada = {};
        }

        saveDb();

        return await interaction.update({
          content:
            buildPainelContent(
              nome
            ),
          components:
            buildButtons(nome),
        });
      }

      // =========================
      // PRISÃO
      // =========================
      if (tipo === "prisao") {

        if (
          !v.membros.includes(id)
        ) {
          return await interaction.reply({
            content:
              "❌ Você precisa estar na viatura.",
            ephemeral: true,
          });
        }

        v.prisoes += 1;

        registrarParaTodaViatura(
          v.membros,
          "prisao",
          1
        );

        saveDb();

        return await interaction.update({
          content:
            buildPainelContent(
              nome
            ),
          components:
            buildButtons(nome),
        });
      }

      // =========================
      // OCORRÊNCIA
      // =========================
      if (
        tipo === "ocorrencia"
      ) {

        if (
          !v.membros.includes(id)
        ) {
          return await interaction.reply({
            content:
              "❌ Você precisa estar na viatura.",
            ephemeral: true,
          });
        }

        v.ocorrencias += 1;

        registrarParaTodaViatura(
          v.membros,
          "ocorrencia",
          1
        );

        saveDb();

        return await interaction.update({
          content:
            buildPainelContent(
              nome
            ),
          components:
            buildButtons(nome),
        });
      }

      // =========================
      // DINHEIRO
      // =========================
      if (tipo === "dinheiro") {

        if (
          !v.membros.includes(id)
        ) {
          return await interaction.reply({
            content:
              "❌ Você precisa estar na viatura.",
            ephemeral: true,
          });
        }

        const modal =
          new ModalBuilder()
            .setCustomId(
              `modal:${nome}`
            )
            .setTitle(
              "Registrar Apreensão"
            );

        const input =
          new TextInputBuilder()
            .setCustomId(
              "valor"
            )
            .setLabel(
              "Valor apreendido"
            )
            .setStyle(
              TextInputStyle.Short
            )
            .setRequired(true)
            .setPlaceholder(
              "Ex: 5000"
            );

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            input
          )
        );

        return await interaction.showModal(
          modal
        );
      }

      // =========================
      // FINALIZAR
      // =========================
      if (
        tipo === "finalizar"
      ) {

        if (!v.membros.includes(id)) {
  return await interaction.reply({
    content: "❌ Você precisa estar na viatura.",
    ephemeral: true,
  });
}

if (v.lider !== id) {
  return await interaction.reply({
    content: "❌ Apenas o líder da viatura pode finalizar a patrulha.",
    ephemeral: true,
  });
}

        const lider =
          v.lider
            ? `<@${v.lider}>`
            : "Nenhum";

        const equipeFinal = [
          ...v.membros,
        ];

        for (const membroId of equipeFinal) {
          registrarSaida(
            v,
            membroId
          );
        }

        const tempoTotal =
          v.inicio
            ? (
                (Date.now() -
                  v.inicio) /
                60000
              ).toFixed(1)
            : "0.0";

        const embed =
          new EmbedBuilder()
            .setTitle(
              `🚔 RELATÓRIO FINAL - ${nome}`
            )
            .setColor("Red")
            .addFields(
              {
                name:
                  "⭐ Comandante",
                value: lider,
              },
              {
                name:
                  "🚓 Viatura",
                value:
                  nome.toUpperCase(),
                inline: true,
              },
              {
                name:
                  "⏱️ Tempo",
                value:
                  `${tempoTotal} min`,
                inline: true,
              },
              {
                name:
                  "💰 Dinheiro",
                value:
                  `R$${v.dinheiro}`,
                inline: true,
              },
              {
                name:
                  "🚔 Prisões",
                value:
                  String(
                    v.prisoes
                  ),
                inline: true,
              },
              {
                name:
                  "📦 Ocorrências",
                value:
                  String(
                    v.ocorrencias
                  ),
                inline: true,
              },
              {
                name:
                  "👮 Equipe",
                value:
                  equipeFinal
                    .map(
                      (id) =>
                        `<@${id}>`
                    )
                    .join("\n") ||
                  "Nenhum",
              },
              {
                name:
                  "⏱️ Tempo Individual",
                value:
                  formatTempoIndividual(
                    v,
                    equipeFinal
                  ),
              }
            )
            .setTimestamp();

        try {

          if (
            process.env
              .LOG_CHANNEL
          ) {

            const canal =
              await client.channels.fetch(
                process.env
                  .LOG_CHANNEL
              );

            if (canal) {
              await canal.send({
                embeds: [
                  embed,
                ],
              });
            }
          }

        } catch (error) {
          console.error(
            "Erro ao enviar log:",
            error
          );
        }

        db.viaturas[nome] = {
          membros: [],
          entrada: {},
          lider: null,
          inicio: null,
          prisoes: 0,
          dinheiro: 0,
          ocorrencias: 0,
          tempoIndividual: {},
          historicoEntradas: [],
          historicoSaidas: [],
        };

        saveDb();

        return await interaction.update({
          content:
            "✅ Patrulha finalizada.",
          embeds: [embed],
          components: [],
        });
      }

      return;
    }

    // =====================================
    // MODAL DINHEIRO
    // =====================================
    if (interaction.isModalSubmit()) {

      const [
        ,
        nomeRaw,
      ] =
        interaction.customId.split(
          ":"
        );

      const nome =
        nomeRaw
          .toUpperCase()
          .trim();

      const valorTexto =
        interaction.fields.getTextInputValue(
          "valor"
        );

      const valor =
        parseInt(
          valorTexto,
          10
        );

      if (
        Number.isNaN(valor) ||
        valor <= 0
      ) {
        return await interaction.reply({
          content:
            "❌ Digite um valor válido.",
          ephemeral: true,
        });
      }

      const v =
        ensureViatura(nome);

      const id =
        interaction.user.id;

      if (
        !v.membros.includes(id)
      ) {
        return await interaction.reply({
          content:
            "❌ Você precisa estar na viatura.",
          ephemeral: true,
        });
      }

      v.dinheiro += valor;

      registrarParaTodaViatura(
        v.membros,
        "dinheiro",
        valor
      );

      saveDb();

      return await interaction.reply({
        content:
          `💰 R$${valor} registrado na viatura ${nome}.`,
        ephemeral: true,
      });
    }

  } catch (error) {

    console.error(error);

    if (
      !interaction.deferred &&
      !interaction.replied
    ) {

      await interaction.reply({
        content:
          "❌ Ocorreu um erro.",
        ephemeral: true,
      });
    }
  }
});

// =====================================
// AUTO UPDATE HIERARQUIA
// =====================================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const cargosMonitorados = [
      ...gruposHierarquia.flatMap((grupo) => grupo.cargos.map((cargo) => cargo.id)),
      ...gruposHierarquia2.flatMap((grupo) => grupo.cargos.map((cargo) => cargo.id)),
    ];

    const mudouCargo = cargosMonitorados.some((cargoId) => {
      const tinhaAntes = oldMember.roles.cache.has(cargoId);
      const temAgora = newMember.roles.cache.has(cargoId);
      return tinhaAntes !== temAgora;
    });

    if (!mudouCargo) return;

    await new Promise((resolve) => setTimeout(resolve, 1500));

await newMember.guild.members.fetch({
  user: newMember.id,
  force: true,
});

await newMember.guild.members.fetch();

    if (process.env.HIERARQUIA_CHANNEL) {
      const canal = await client.channels.fetch(process.env.HIERARQUIA_CHANNEL);
      const mensagens = await canal.messages.fetch({ limit: 30 });

      for (const grupo of gruposHierarquia) {
        const embed = montarEmbedHierarquia(newMember.guild, grupo);

        const msg = mensagens.find(
          (m) =>
            m.author.id === client.user.id &&
            m.embeds[0]?.title === grupo.titulo
        );

        if (msg) {
          await msg.edit({
            embeds: [embed],
            allowedMentions: { parse: [] },
          });
        } else {
          await canal.send({
            embeds: [embed],
            allowedMentions: { parse: [] },
          });
        }
      }
    }

    if (process.env.HIERARQUIA2_CHANNEL) {
      const canal2 = await client.channels.fetch(process.env.HIERARQUIA2_CHANNEL);
      const mensagens2 = await canal2.messages.fetch({ limit: 30 });

      for (const grupo of gruposHierarquia2) {
        const embed = montarEmbedHierarquia(newMember.guild, grupo);

        const msg2 = mensagens2.find(
          (m) =>
            m.author.id === client.user.id &&
            m.embeds[0]?.title === grupo.titulo
        );

        if (msg2) {
          await msg2.edit({
            embeds: [embed],
            allowedMentions: { parse: [] },
          });
        } else {
          await canal2.send({
            embeds: [embed],
            allowedMentions: { parse: [] },
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar hierarquia:", error);
  }
});

client.login(process.env.TOKEN);