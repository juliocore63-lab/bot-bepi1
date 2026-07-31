const { PermissionFlagsBits } = require("discord.js");
const config = require("./config");

function possuiAcesso(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  if (!config.cargosAutorizados.length) return false;

  return config.cargosAutorizados.some((id) =>
    interaction.member?.roles?.cache?.has(id)
  );
}

async function negarAcesso(interaction) {
  const payload = {
    content: "❌ Você não possui autorização para acessar a Corregedoria.",
    ephemeral: true,
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

module.exports = { possuiAcesso, negarAcesso };
