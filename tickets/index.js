const fs = require("fs");
const path = require("path");
const discordTranscripts = require("discord-html-transcripts");

const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const Ticket = require("../models/Ticket");
const TicketCounter = require("../models/TicketCounter");
const guildConfigs = require("./config.json");

const ASSETS_PATH = path.join(__dirname, "assets");

const CUSTOM_IDS = {
  menu: "tickets:abrir",
  claim: "tickets:assumir",
  add: "tickets:adicionar",
  remove: "tickets:remover",
  close: "tickets:fechar",
  closeModal: "tickets:fechar:modal",
  closeReason: "tickets:fechar:motivo",
};

const TICKET_TYPES = {
  denuncia: {
    label: "Denúncia",
    menuLabel: "Denúncias",
    emoji: "🚨",
    prefix: "denuncia",
    color: "#ED4245",
    image: "ticket-denuncia.png",
    menuDescription: "Reportar uma infração ou denúncia",
    description: [
      "Envie as informações abaixo:",
      "",
      "• Nome do denunciado",
      "• ID do denunciado",
      "• Descrição do ocorrido",
      "• Prints, vídeos ou outras provas",
      "",
      "A equipe analisará sua denúncia.",
    ].join("\n"),
  },

  duvida: {
    label: "Dúvida",
    menuLabel: "Dúvidas",
    emoji: "❓",
    prefix: "duvida",
    color: "#5865F2",
    image: "ticket-duvida.png",
    menuDescription: "Tirar dúvidas com a equipe",
    description: [
      "Explique sua dúvida com todos os detalhes possíveis.",
      "",
      "Quanto mais informações você enviar, mais rápido a equipe poderá ajudar.",
    ].join("\n"),
  },

  transferencia: {
    label: "Transferência",
    menuLabel: "Transferência",
    emoji: "🔁",
    prefix: "transferencia",
    color: "#FEE75C",
    image: "ticket-transferencia.png",
    menuDescription: "Solicitar uma transferência",
    description: [
      "Envie as informações abaixo:",
      "",
      "• Seu nome",
      "• Seu ID",
      "• Motivo da transferência",
      "• Demais informações necessárias",
      "",
      "Aguarde a equipe responsável.",
    ].join("\n"),
  },
};

function getGuildConfig(guildId) {
  return guildConfigs[guildId] ?? null;
}

function getTicketType(type) {
  return TICKET_TYPES[type] ?? null;
}

function getAssetPath(fileName) {
  return path.join(ASSETS_PATH, fileName);
}

function assetExists(fileName) {
  return fs.existsSync(getAssetPath(fileName));
}

function createAttachment(fileName) {
  if (!assetExists(fileName)) {
    return null;
  }

  return new AttachmentBuilder(getAssetPath(fileName), {
    name: fileName,
  });
}

function memberIsStaff(interaction, guildConfig) {
  if (!interaction.member || !guildConfig) {
    return false;
  }

  const isAdministrator = interaction.member.permissions.has(
    PermissionFlagsBits.Administrator
  );

  const hasStaffRole = interaction.member.roles.cache.has(
    guildConfig.staffRoleId
  );

  return isAdministrator || hasStaffRole;
}

async function getNextTicketNumber(guildId) {
  const counter = await TicketCounter.findOneAndUpdate(
    { guildId },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return counter.sequence;
}

async function findOpenTicketByThread(interaction) {
  return Ticket.findOne({
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    status: "open",
  });
}

async function sendTicketPanel(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await interaction.reply({
      content:
        "❌ Este servidor não está configurado em `tickets/config.json`.",
      ephemeral: true,
    });

    return true;
  }

  const isAdministrator = interaction.member.permissions.has(
    PermissionFlagsBits.Administrator
  );

  if (!isAdministrator) {
    await interaction.reply({
      content: "❌ Apenas administradores podem enviar o painel.",
      ephemeral: true,
    });

    return true;
  }

  const embed = new EmbedBuilder()
    .setColor("#F57C00")
    .setTitle(`🎧 ${guildConfig.panelTitle}`)
    .setDescription(
      [
        "**Bem-vindo à nossa central de atendimento!**",
        "",
        "Escolha abaixo o tipo de atendimento que você precisa.",
        "Nossa equipe responderá assim que possível.",
        "",
        "ℹ️ Após abrir um ticket, explique sua solicitação e aguarde um atendente.",
      ].join("\n")
    )
    .setFooter({
      text: `${interaction.guild.name} • Sistema de Tickets`,
      iconURL: interaction.guild.iconURL() || undefined,
    });

  const files = [];
  const panelAttachment = createAttachment("painel.png");

  if (panelAttachment) {
    files.push(panelAttachment);
    embed.setImage("attachment://painel.png");
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.menu)
    .setPlaceholder("Selecione uma categoria")
    .addOptions(
      Object.entries(TICKET_TYPES).map(([value, ticketType]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(ticketType.menuLabel)
          .setDescription(ticketType.menuDescription)
          .setEmoji(ticketType.emoji)
          .setValue(value)
      )
    );

  await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menu),
    ],
    files,
  });

  return true;
}

async function createTicket(interaction) {
  await interaction.deferReply({
    ephemeral: true,
  });

  const guildConfig = getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await interaction.editReply({
      content:
        "❌ Este servidor não está configurado no sistema de tickets.",
    });

    return true;
  }

  const selectedType = interaction.values[0];
  const ticketType = getTicketType(selectedType);

  if (!ticketType) {
    await interaction.editReply({
      content: "❌ Categoria de ticket inválida.",
    });

    return true;
  }

  const existingTicket = await Ticket.findOne({
    guildId: interaction.guildId,
    ownerId: interaction.user.id,
    status: "open",
  });

  if (existingTicket) {
    const existingThread =
      interaction.guild.channels.cache.get(existingTicket.channelId) ||
      (await interaction.guild.channels
        .fetch(existingTicket.channelId)
        .catch(() => null));

    if (existingThread?.isThread() && !existingThread.archived) {
      await interaction.editReply({
        content: `⚠️ Você já possui um ticket aberto: ${existingThread}`,
      });

      return true;
    }

    existingTicket.status = "closed";
    existingTicket.closedAt = new Date();
    existingTicket.closeReason =
      "A thread não foi encontrada ou já estava arquivada.";

    await existingTicket.save();
  }

  const ticketParent =
    interaction.guild.channels.cache.get(guildConfig.ticketChannelId) ||
    (await interaction.guild.channels
      .fetch(guildConfig.ticketChannelId)
      .catch(() => null));

  if (
    !ticketParent ||
    ticketParent.type !== ChannelType.GuildText
  ) {
    await interaction.editReply({
      content:
        "❌ O canal principal de tickets não foi encontrado ou não é um canal de texto.",
    });

    return true;
  }

  const staffRole =
    interaction.guild.roles.cache.get(guildConfig.staffRoleId) ||
    (await interaction.guild.roles
      .fetch(guildConfig.staffRoleId)
      .catch(() => null));

  if (!staffRole) {
    await interaction.editReply({
      content: "❌ O cargo da equipe não foi encontrado.",
    });

    return true;
  }

  const ticketNumber = await getNextTicketNumber(
    interaction.guildId
  );

  const formattedNumber = String(ticketNumber).padStart(4, "0");
  const threadName = `${ticketType.prefix}-${formattedNumber}`;

  let ticketThread;

  try {
    ticketThread = await ticketParent.threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      autoArchiveDuration: 1440,
      invitable: false,
      reason: `Ticket aberto por ${interaction.user.tag}`,
    });

    await ticketThread.members.add(interaction.user.id);
  } catch (error) {
    console.error("Erro ao criar a thread do ticket:", error);

    await interaction.editReply({
      content:
        "❌ Não foi possível criar o ticket. Verifique as permissões do bot no canal principal.",
    });

    return true;
  }

  try {
    await Ticket.create({
      guildId: interaction.guildId,
      ticketId: ticketNumber,
      ownerId: interaction.user.id,
      channelId: ticketThread.id,
      type: selectedType,
      claimedBy: null,
      status: "open",
    });
  } catch (error) {
    console.error("Erro ao salvar o ticket no MongoDB:", error);

    await ticketThread
      .send("❌ Não foi possível salvar este ticket no banco de dados.")
      .catch(() => null);

    await ticketThread.setLocked(true).catch(() => null);
    await ticketThread.setArchived(true).catch(() => null);

    await interaction.editReply({
      content:
        "❌ O ticket foi criado, mas não pôde ser salvo no MongoDB.",
    });

    return true;
  }

  const embed = new EmbedBuilder()
    .setColor(ticketType.color)
    .setTitle(`${ticketType.emoji} ${ticketType.label}`)
    .setDescription(
      [
        `${interaction.user}`,
        "",
        ticketType.description,
        "",
        `🆔 **Ticket:** ${threadName}`,
      ].join("\n")
    )
    .addFields(
      {
        name: "Usuário",
        value: `${interaction.user}`,
        inline: true,
      },
      {
        name: "Categoria",
        value: ticketType.label,
        inline: true,
      },
      {
        name: "Status",
        value: "Aguardando atendimento",
        inline: true,
      }
    )
    .setTimestamp();

  const files = [];
  const ticketAttachment = createAttachment(ticketType.image);

  if (ticketAttachment) {
    files.push(ticketAttachment);
    embed.setImage(`attachment://${ticketType.image}`);
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.claim)
      .setLabel("Assumir")
      .setEmoji("👤")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.add)
      .setLabel("Adicionar")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.remove)
      .setLabel("Remover")
      .setEmoji("➖")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.close)
      .setLabel("Fechar")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  await ticketThread.send({
    content: `${interaction.user} | ${staffRole}`,
    embeds: [embed],
    components: [buttons],
    files,
    allowedMentions: {
      users: [interaction.user.id],
      roles: [staffRole.id],
    },
  });

  await interaction.editReply({
    content: `✅ Seu ticket foi criado: ${ticketThread}`,
  });

  return true;
}

async function claimTicket(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await interaction.reply({
      content: "❌ Este servidor não está configurado.",
      ephemeral: true,
    });

    return true;
  }

  if (!memberIsStaff(interaction, guildConfig)) {
    await interaction.reply({
      content: "❌ Apenas a equipe pode assumir tickets.",
      ephemeral: true,
    });

    return true;
  }

  const ticket = await findOpenTicketByThread(interaction);

  if (!ticket) {
    await interaction.reply({
      content: "❌ Este ticket não foi encontrado no banco de dados.",
      ephemeral: true,
    });

    return true;
  }

  if (ticket.claimedBy) {
    await interaction.reply({
      content: `⚠️ Este ticket já foi assumido por <@${ticket.claimedBy}>.`,
      ephemeral: true,
    });

    return true;
  }

  ticket.claimedBy = interaction.user.id;
  await ticket.save();

  await interaction.reply({
    content: `✅ Ticket assumido por ${interaction.user}.`,
  });

  return true;
}

async function showAddUserInstructions(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticket = await findOpenTicketByThread(interaction);

  if (!ticket) {
    await interaction.reply({
      content: "❌ Este ticket não foi encontrado.",
      ephemeral: true,
    });

    return true;
  }

  const canManage =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canManage) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode adicionar usuários.",
      ephemeral: true,
    });

    return true;
  }

  await interaction.reply({
    content: "Use `/add usuario:@usuário` para adicionar alguém.",
    ephemeral: true,
  });

  return true;
}

async function showRemoveUserInstructions(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticket = await findOpenTicketByThread(interaction);

  if (!ticket) {
    await interaction.reply({
      content: "❌ Este ticket não foi encontrado.",
      ephemeral: true,
    });

    return true;
  }

  const canManage =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canManage) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode remover usuários.",
      ephemeral: true,
    });

    return true;
  }

  await interaction.reply({
    content: "Use `/remove usuario:@usuário` para remover alguém.",
    ephemeral: true,
  });

  return true;
}

async function addUserToTicket(interaction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "❌ Use este comando dentro de um ticket.",
      ephemeral: true,
    });

    return true;
  }

  const guildConfig = getGuildConfig(interaction.guildId);
  const ticket = await findOpenTicketByThread(interaction);

  if (!guildConfig || !ticket) {
    await interaction.reply({
      content: "❌ Esta thread não pertence ao sistema de tickets.",
      ephemeral: true,
    });

    return true;
  }

  const canManage =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canManage) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode adicionar usuários.",
      ephemeral: true,
    });

    return true;
  }

  const user = interaction.options.getUser("usuario", true);

  try {
    await interaction.channel.members.add(user.id);

    await interaction.reply({
      content: `✅ ${user} foi adicionado ao ticket.`,
    });
  } catch (error) {
    console.error("Erro ao adicionar usuário à thread:", error);

    await interaction.reply({
      content: "❌ Não foi possível adicionar esse usuário.",
      ephemeral: true,
    });
  }

  return true;
}

async function removeUserFromTicket(interaction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "❌ Use este comando dentro de um ticket.",
      ephemeral: true,
    });

    return true;
  }

  const guildConfig = getGuildConfig(interaction.guildId);
  const ticket = await findOpenTicketByThread(interaction);

  if (!guildConfig || !ticket) {
    await interaction.reply({
      content: "❌ Esta thread não pertence ao sistema de tickets.",
      ephemeral: true,
    });

    return true;
  }

  const canManage =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canManage) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode remover usuários.",
      ephemeral: true,
    });

    return true;
  }

  const user = interaction.options.getUser("usuario", true);

  if (user.id === ticket.ownerId) {
    await interaction.reply({
      content: "❌ O dono não pode ser removido do próprio ticket.",
      ephemeral: true,
    });

    return true;
  }

  try {
    await interaction.channel.members.remove(user.id);

    await interaction.reply({
      content: `✅ ${user} foi removido do ticket.`,
    });
  } catch (error) {
    console.error("Erro ao remover usuário da thread:", error);

    await interaction.reply({
      content: "❌ Não foi possível remover esse usuário.",
      ephemeral: true,
    });
  }

  return true;
}

async function showCloseModal(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticket = await findOpenTicketByThread(interaction);

  if (!guildConfig || !ticket) {
    await interaction.reply({
      content: "❌ Este ticket não foi encontrado.",
      ephemeral: true,
    });

    return true;
  }

  const canClose =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canClose) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode fechá-lo.",
      ephemeral: true,
    });

    return true;
  }

  const reasonInput = new TextInputBuilder()
    .setCustomId(CUSTOM_IDS.closeReason)
    .setLabel("Motivo do fechamento")
    .setPlaceholder("Informe por que este ticket está sendo fechado.")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(3)
    .setMaxLength(1000)
    .setRequired(true);

  const modal = new ModalBuilder()
    .setCustomId(CUSTOM_IDS.closeModal)
    .setTitle("Fechar ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(reasonInput)
    );

  await interaction.showModal(modal);

  return true;
}

async function closeTicket(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await interaction.reply({
      content: "❌ Este servidor não está configurado.",
      ephemeral: true,
    });

    return true;
  }

  const ticket = await findOpenTicketByThread(interaction);

  if (!ticket) {
    await interaction.reply({
      content: "❌ Este ticket não foi encontrado.",
      ephemeral: true,
    });

    return true;
  }

  const canClose =
    ticket.ownerId === interaction.user.id ||
    memberIsStaff(interaction, guildConfig);

  if (!canClose) {
    await interaction.reply({
      content:
        "❌ Apenas o dono do ticket ou a equipe pode fechá-lo.",
      ephemeral: true,
    });

    return true;
  }

  const reason = interaction.fields.getTextInputValue(
    CUSTOM_IDS.closeReason
  );

  await interaction.reply({
    content: "🔒 Gerando o transcript e fechando o ticket...",
  });

  let transcript = null;

  try {
    transcript = await discordTranscripts.createTranscript(
      interaction.channel,
      {
        limit: -1,
        returnType: "attachment",
        filename: `transcript-${interaction.channel.name}.html`,
        saveImages: true,
        poweredBy: false,
      }
    );
  } catch (error) {
    console.error("Erro ao gerar transcript:", error);
  }

  ticket.status = "closed";
  ticket.closedBy = interaction.user.id;
  ticket.closeReason = reason;
  ticket.closedAt = new Date();

  await ticket.save();

  const logChannel =
    interaction.guild.channels.cache.get(guildConfig.logChannelId) ||
    (await interaction.guild.channels
      .fetch(guildConfig.logChannelId)
      .catch(() => null));

  if (logChannel?.isTextBased()) {
    const ticketType = getTicketType(ticket.type);

    const durationMilliseconds =
      ticket.closedAt.getTime() - ticket.createdAt.getTime();

    const durationMinutes = Math.max(
      0,
      Math.floor(durationMilliseconds / 60000)
    );

    const logEmbed = new EmbedBuilder()
      .setColor("#ED4245")
      .setTitle("🔒 Ticket fechado")
      .addFields(
        {
          name: "Usuário",
          value: `<@${ticket.ownerId}>`,
          inline: true,
        },
        {
          name: "Fechado por",
          value: `${interaction.user}`,
          inline: true,
        },
        {
          name: "Assumido por",
          value: ticket.claimedBy
            ? `<@${ticket.claimedBy}>`
            : "Ninguém",
          inline: true,
        },
        {
          name: "Categoria",
          value: ticketType
            ? `${ticketType.emoji} ${ticketType.label}`
            : ticket.type,
          inline: true,
        },
        {
          name: "Ticket",
          value: interaction.channel.name,
          inline: true,
        },
        {
          name: "Duração",
          value: `${durationMinutes} minuto(s)`,
          inline: true,
        },
        {
          name: "Motivo",
          value: reason,
        }
      )
      .setTimestamp();

    const files = [];

    const closedAttachment = createAttachment(
      "ticket-fechado.png"
    );

    if (closedAttachment) {
      files.push(closedAttachment);
      logEmbed.setImage("attachment://ticket-fechado.png");
    }

    if (transcript) {
      files.push(transcript);
    }

    await logChannel
      .send({
        embeds: [logEmbed],
        files,
      })
      .catch((error) => {
        console.error("Erro ao enviar log do ticket:", error);
      });
  }

  setTimeout(async () => {
    await interaction.channel
      .setLocked(true, `Ticket fechado por ${interaction.user.tag}`)
      .catch(() => null);

    await interaction.channel
      .setArchived(true, `Ticket fechado por ${interaction.user.tag}`)
      .catch(() => null);
  }, 5000);

  return true;
}

async function handleButton(interaction) {
  if (interaction.customId === CUSTOM_IDS.claim) {
    return claimTicket(interaction);
  }

  if (interaction.customId === CUSTOM_IDS.add) {
    return showAddUserInstructions(interaction);
  }

  if (interaction.customId === CUSTOM_IDS.remove) {
    return showRemoveUserInstructions(interaction);
  }

  if (interaction.customId === CUSTOM_IDS.close) {
    return showCloseModal(interaction);
  }

  return false;
}

/**
 * Função chamada pelo interactionCreate do bot principal.
 *
 * Retorna true quando a interação pertence aos tickets.
 * Retorna false quando os demais sistemas devem processá-la.
 */
async function handleTicketInteraction(interaction) {
  if (!interaction.inGuild()) {
    return false;
  }

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "ticketsetup"
  ) {
    return sendTicketPanel(interaction);
  }

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "add"
  ) {
    return addUserToTicket(interaction);
  }

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "remove"
  ) {
    return removeUserFromTicket(interaction);
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === CUSTOM_IDS.menu
  ) {
    return createTicket(interaction);
  }

  if (
    interaction.isButton() &&
    interaction.customId.startsWith("tickets:")
  ) {
    return handleButton(interaction);
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId === CUSTOM_IDS.closeModal
  ) {
    return closeTicket(interaction);
  }

  return false;
}

module.exports = {
  handleTicketInteraction,
};