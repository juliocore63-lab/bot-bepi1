require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
} = require("discord.js");

const registrarReady = require("./events/ready");
const registrarInteractionCreate = require("./events/interactionCreate");
const registrarGuildMemberUpdate = require("./events/guildMemberUpdate");

const {
  registrarEditalPMCE,
} = require("./editalpmce");

const {
  registrarCursoPMCE,
} = require("./cursoPMCE");

const criarContextoBot = require("./bootstrap");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

registrarReady(client);
registrarEditalPMCE(client);
registrarCursoPMCE(client);

async function iniciarBot() {
  const contexto = await criarContextoBot();

  registrarInteractionCreate(client, contexto);

  registrarGuildMemberUpdate(client, {
    gruposHierarquia: contexto.gruposHierarquia,
    gruposHierarquia2: contexto.gruposHierarquia2,
    gruposHierarquia3: contexto.gruposHierarquia3,
    montarEmbedHierarquia: contexto.montarEmbedHierarquia,
  });

  const encerrar = async (signal) => {
    console.log(
      `Recebido ${signal}. Salvando dados antes de encerrar...`
    );

    try {
      await contexto.flush();
    } catch (error) {
      console.error(
        "❌ Erro ao salvar os dados antes de encerrar:",
        error
      );
    } finally {
      client.destroy();
      process.exit(0);
    }
  };

  process.once("SIGINT", () => encerrar("SIGINT"));
  process.once("SIGTERM", () => encerrar("SIGTERM"));

  await client.login(process.env.TOKEN);
}

iniciarBot().catch((error) => {
  console.error("❌ Erro ao iniciar o bot:", error);
  process.exitCode = 1;
});
