const { EmbedBuilder } = require("discord.js");

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
      { nome: "BR ¦ Aposentado", id: "1505273752462688476" },
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

const gruposHierarquia3 = [
  {
    titulo: "⚔️ Hierarquia BEPI ⚔️",
    cor: "#D2B48C", // Bege
    cargos: [
      {
        nome: "⚔️ Comando BEPI ⚔️",
        id: "1482090881208025391",
      },
      {
        nome: "⚔️ Sub-Comando BEPI ⚔️",
        id: "1528867713596915984",
      },
      {
        nome: "⚔️ Instrutor BEPI ⚔️",
        id: "1528867713965883392",
      },
      {
        nome: "⚔️ Membros BEPI ⚔️",
        id: "1528867699084759261",
      },
    ],
  },
];

module.exports = {
  montarEmbedHierarquia,
  gruposHierarquia,
  gruposHierarquia2,
  gruposHierarquia3,
};