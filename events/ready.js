const { REST, Routes } = require("discord.js");
const commands = require("../config/commands");

module.exports = function registrarReady(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  client.once("clientReady", async () => {
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
};