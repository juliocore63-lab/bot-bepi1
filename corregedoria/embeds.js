const { EmbedBuilder } = require("discord.js");
const config = require("./config");

function aplicarBanner(embed) {
  if (config.bannerUrl) embed.setImage(config.bannerUrl);
  return embed;
}

function painelPrincipalEmbed() {
  return aplicarBanner(
    new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("⚖️ CORREGEDORIA PMCE")
      .setDescription(
        [
          "Sistema interno de procedimentos disciplinares.",
          "",
          "Utilize os botões abaixo para criar, consultar e acompanhar processos.",
        ].join("\n")
      )
      .setFooter({ text: "Central Operacional PMCE • Corregedoria" })
      .setTimestamp()
  );
}

function processoEmbed(processo) {
  const status = {
    EM_ANALISE: "🔎 Em análise",
    EM_DILIGENCIA: "🕵️ Em diligência",
    AGUARDANDO_DEPOIMENTO: "📝 Aguardando depoimento",
    CONCLUSO: "📚 Concluso",
    CONCLUIDO: "✅ Concluído",
    ARQUIVADO: "📦 Arquivado",
  }[processo.status] || processo.status;

  return aplicarBanner(
    new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle(`⚖️ ${processo.codigo}`)
      .setDescription("Painel interno do procedimento disciplinar.")
      .addFields(
        { name: "👤 Investigado", value: `<@${processo.investigadoId}>`, inline: true },
        { name: "🛡️ Responsável", value: `<@${processo.responsavelId}>`, inline: true },
        { name: "📌 Situação", value: status, inline: true },
        { name: "📂 Tipo", value: processo.tipo.slice(0, 1024) },
        { name: "📝 Motivo", value: processo.motivo.slice(0, 1024) },
        {
          name: "📎 Observações",
          value: (processo.observacoes || "Nenhuma observação inicial.").slice(0, 1024),
        }
      )
      .setFooter({ text: `Identificador: ${processo.codigo}` })
      .setTimestamp(processo.createdAt || new Date())
  );
}

module.exports = { painelPrincipalEmbed, processoEmbed };
