const fs = require("fs");
const path = require("path");

const {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

const CONFIG = {
  guildId: "1063543329066852572",
  promotionChannelId: "1141776901510271088",
  responsibleRoleId: "1141776577328324669",

  ranks: [
    {
      name: "Recruta",
      abbreviation: "REC PM",
      roleId: "1465100597152841892",
    },
    {
      name: "Soldado",
      abbreviation: "SD PM",
      roleId: "1141776605123977327",
    },
    {
      name: "Cabo",
      abbreviation: "CB PM",
      roleId: "1141776603949580349",
    },
    {
      name: "3º Sargento",
      abbreviation: "3º SGT PM",
      roleId: "1141776602703867914",
    },
    {
      name: "2º Sargento",
      abbreviation: "2º SGT PM",
      roleId: "1141776601701433414",
    },
    {
      name: "1º Sargento",
      abbreviation: "1º SGT PM",
      roleId: "1141776600598335582",
    },
    {
      name: "Sub-Tenente",
      abbreviation: "ST PM",
      roleId: "1498676034328068187",
    },
    {
      name: "Aspirante a Oficial",
      abbreviation: "ASP PM",
      roleId: "1141776586740350978",
    },
    {
      name: "2º Tenente",
      abbreviation: "2º TEN PM",
      roleId: "1141776596257226803",
    },
    {
      name: "1º Tenente",
      abbreviation: "1º TEN PM",
      roleId: "1141776594420105287",
    },
    {
      name: "Capitão",
      abbreviation: "CAP PM",
      roleId: "1141776591496679504",
    },
    {
      name: "Major",
      abbreviation: "MAJ PM",
      roleId: "1141776589605060618",
    },
    {
      name: "Tenente Coronel",
      abbreviation: "TC PM",
      roleId: "1141776588749418626",
    },
    {
      name: "Coronel",
      abbreviation: "CEL PM",
      roleId: "1141776577328324669",
    },
  ],
};

const PROMOTION_IMAGE_PATH = path.join(
  __dirname,
  "assets",
  "promocao.png"
);

function normalizeName(value) {
  return value
    .replace(
      /^(REC|SD|CB|3º SGT|2º SGT|1º SGT|ST|ASP|2º TEN|1º TEN|CAP|MAJ|TC|CEL)\s+PM\s*\|\s*/i,
      ""
    )
    .replace(/\s*-\s*\d+\s*$/, "")
    .trim();
}

function findCurrentRank(member) {
  return CONFIG.ranks.find((rank) =>
    member.roles.cache.has(rank.roleId)
  );
}

function getNextRank(currentRank) {
  const currentIndex = CONFIG.ranks.findIndex(
    (rank) => rank.roleId === currentRank.roleId
  );

  if (
    currentIndex === -1 ||
    currentIndex >= CONFIG.ranks.length - 1
  ) {
    return null;
  }

  return CONFIG.ranks[currentIndex + 1];
}

function memberCanPromote(interaction) {
  const isAdministrator =
    interaction.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

  const hasResponsibleRole =
    interaction.member.roles.cache.has(
      CONFIG.responsibleRoleId
    );

  return isAdministrator || hasResponsibleRole;
}

async function promoteMember(interaction) {
  if (interaction.guildId !== CONFIG.guildId) {
    await interaction.reply({
      content:
        "❌ Este comando não está disponível neste servidor.",
      flags: MessageFlags.Ephemeral,
    });

    return true;
  }

  if (!memberCanPromote(interaction)) {
    await interaction.reply({
      content:
        "❌ Você não possui permissão para promover policiais.",
      flags: MessageFlags.Ephemeral,
    });

    return true;
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  const user = interaction.options.getUser("policial", true);
  const rg = interaction.options.getString("rg", true).trim();

  const member = await interaction.guild.members
    .fetch(user.id)
    .catch(() => null);

  if (!member) {
    await interaction.editReply({
      content: "❌ O policial não foi encontrado no servidor.",
    });

    return true;
  }

  if (user.bot) {
    await interaction.editReply({
      content: "❌ Bots não podem ser promovidos.",
    });

    return true;
  }

  const currentRank = findCurrentRank(member);

  if (!currentRank) {
    await interaction.editReply({
      content:
        "❌ O policial não possui nenhuma patente reconhecida pelo sistema.",
    });

    return true;
  }

  const nextRank = getNextRank(currentRank);

  if (!nextRank) {
    await interaction.editReply({
      content:
        "❌ Este policial já está na patente máxima: Coronel.",
    });

    return true;
  }

  const oldRole = interaction.guild.roles.cache.get(
    currentRank.roleId
  );

  const newRole = interaction.guild.roles.cache.get(
    nextRank.roleId
  );

  if (!oldRole || !newRole) {
    await interaction.editReply({
      content:
        "❌ Um dos cargos da promoção não foi encontrado.",
    });

    return true;
  }

  const botMember = interaction.guild.members.me;

  if (
    oldRole.position >= botMember.roles.highest.position ||
    newRole.position >= botMember.roles.highest.position
  ) {
    await interaction.editReply({
      content:
        "❌ O cargo do bot precisa estar acima de todas as patentes.",
    });

    return true;
  }

  const promotionChannel =
    interaction.guild.channels.cache.get(
      CONFIG.promotionChannelId
    ) ||
    (await interaction.guild.channels
      .fetch(CONFIG.promotionChannelId)
      .catch(() => null));

  if (!promotionChannel?.isTextBased()) {
    await interaction.editReply({
      content:
        "❌ O canal de promoções não foi encontrado.",
    });

    return true;
  }

  try {
    await member.roles.remove(
      oldRole,
      `Promoção realizada por ${interaction.user.tag}`
    );

    await member.roles.add(
      newRole,
      `Promoção realizada por ${interaction.user.tag}`
    );
  } catch (error) {
    console.error("Erro ao alterar cargos:", error);

    await interaction.editReply({
      content:
        "❌ Não foi possível alterar os cargos. Verifique a hierarquia e as permissões do bot.",
    });

    return true;
  }

  const currentDisplayName =
    member.nickname || member.user.globalName || member.user.username;

  const policeName = normalizeName(currentDisplayName);

  const newNickname =
    `${nextRank.abbreviation} | ${policeName} - ${rg}`.slice(
      0,
      32
    );

  await member
    .setNickname(
      newNickname,
      `Promoção realizada por ${interaction.user.tag}`
    )
    .catch((error) => {
      console.error(
        "Não foi possível alterar o apelido:",
        error
      );
    });

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("[CGE] Informe de Promoção de Efetivo")
    .setDescription(
      [
        `✨ 👮 **QRA:** ${member}`,
        `🪪 **RG:** ${rg}`,
        `🔰 **PATENTE ANTIGA:** ${currentRank.name}`,
        `🔰 **PATENTE NOVA:** ${nextRank.name}`,
        "",
        "────────────────────────────",
        "",
        "*O Comando Geral do 36º Batalhão Especializado em Policiamento de Interior, parabeniza o mesmo pela dedicação desde o ingresso na corporação, mostrando sua eficiência e compromisso com as suas atividades, fazendo jus a sua promoção.*",
        "",
        `Atenciosamente: ${interaction.user}`,
      ].join("\n")
    )
    .setTimestamp();

  const files = [];

  if (fs.existsSync(PROMOTION_IMAGE_PATH)) {
    const promotionImage = new AttachmentBuilder(
      PROMOTION_IMAGE_PATH,
      {
        name: "promocao.png",
      }
    );

    files.push(promotionImage);
    embed.setImage("attachment://promocao.png");
  }

  try {
    await promotionChannel.send({
      content: `${member}`,
      embeds: [embed],
      files,
      allowedMentions: {
        users: [member.id, interaction.user.id],
      },
    });
  } catch (error) {
    console.error(
      "Erro ao enviar anúncio de promoção:",
      error
    );

    // Reverte os cargos se o anúncio falhar.
    await member.roles.remove(newRole).catch(() => null);
    await member.roles.add(oldRole).catch(() => null);

    await interaction.editReply({
      content:
        "❌ A promoção foi revertida porque não foi possível enviar o anúncio.",
    });

    return true;
  }

  await interaction.editReply({
    content: [
      `✅ ${member} foi promovido.`,
      `**Patente antiga:** ${currentRank.name}`,
      `**Patente nova:** ${nextRank.name}`,
    ].join("\n"),
  });

  return true;
}

async function handlePromotionInteraction(interaction) {
  if (!interaction.inGuild()) {
    return false;
  }

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "promover"
  ) {
    return promoteMember(interaction);
  }

  return false;
}

module.exports = {
  handlePromotionInteraction,
};