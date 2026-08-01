const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const { editalPMCECommand } = require("../editalpmce");
const { cursoPMCECommand } = require("../cursoPMCE");

const commands = [
  editalPMCECommand,
  cursoPMCECommand,

  new SlashCommandBuilder()
  .setName("ticketsetup")
  .setDescription("Enviar o painel de tickets")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  ),

new SlashCommandBuilder()
  .setName("add")
  .setDescription("Adicionar um usuário ao ticket")
  .addUserOption((option) =>
    option
      .setName("usuario")
      .setDescription("Usuário que será adicionado")
      .setRequired(true)
  ),

new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remover um usuário do ticket")
  .addUserOption((option) =>
    option
      .setName("usuario")
      .setDescription("Usuário que será removido")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
    .setName("corregedoria")
    .setDescription("Abrir o painel da Corregedoria"),

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
  .setName("zerartempo")
  .setDescription("Zerar tempo semanal de todos os policiais"),

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

module.exports = commands;