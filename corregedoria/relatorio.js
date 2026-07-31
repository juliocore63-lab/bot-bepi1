const { EmbedBuilder } = require("discord.js");

function formatarStatus(status) {
    switch (status) {
        case "EM_ANALISE":
            return "🟡 Em Análise";
        case "EM_DILIGENCIA":
            return "🟠 Em Diligência";
        case "AGUARDANDO_DEPOIMENTO":
            return "🟣 Aguardando Depoimento";
        case "CONCLUIDO":
            return "🔵 Concluído";
        case "ARQUIVADO":
            return "⚫ Arquivado";
        default:
            return status || "Não informado";
    }
}

function gerarTextoRelatorio(processo) {

    let texto = "";

    texto += "POLÍCIA MILITAR DO CEARÁ\n";
    texto += "CORREGEDORIA\n";
    texto += "RELATÓRIO DE PROCESSO DISCIPLINAR\n\n";

    texto += `Código: ${processo.codigo}\n`;
    texto += `Situação: ${formatarStatus(processo.status)}\n`;
    texto += `Investigado: ${processo.investigadoId}\n`;
    texto += `Responsável: ${processo.responsavelId}\n\n`;

    texto += "=============================\n";
    texto += "MOTIVO\n";
    texto += "=============================\n\n";

    texto += processo.motivo + "\n\n";
    texto += "=============================\n";
texto += "INTIMAÇÕES\n";
texto += "=============================\n\n";

if (!processo.intimacoes.length) {

    texto += "Nenhuma intimação registrada.\n\n";

} else {

    processo.intimacoes.forEach((i, index) => {

        texto += `${index + 1}. Destinatário: ${i.destinatarioId}\n`;
        texto += `Motivo: ${i.motivo}\n`;
        texto += `Data: ${i.data}\n`;
        texto += `Horário: ${i.horario}\n\n`;

    });

}

texto += "=============================\n";
texto += "DEPOIMENTOS\n";
texto += "=============================\n\n";

if (!processo.depoimentos.length) {

    texto += "Nenhum depoimento registrado.\n\n";

} else {

    processo.depoimentos.forEach((d, index) => {

        texto += `${index + 1}. Autor: ${d.autorId}\n`;
        texto += `Data: ${d.data}\n`;
        texto += `Horário: ${d.horario}\n`;
        texto += `Resumo:\n${d.resumo}\n`;

        if (d.observacoes) {
            texto += `Observações:\n${d.observacoes}\n`;
        }

        texto += "\n";

    });

}

texto += "=============================\n";
texto += "TESTEMUNHAS\n";
texto += "=============================\n\n";

if (!processo.testemunhas.length) {

    texto += "Nenhuma testemunha registrada.\n\n";

} else {

    processo.testemunhas.forEach((t, index) => {

        texto += `${index + 1}. Testemunha: ${t.testemunhaId}\n`;
        texto += `Data: ${t.data}\n`;
        texto += `Horário: ${t.horario}\n`;
        texto += `Resumo:\n${t.resumo}\n`;

        if (t.observacoes) {
            texto += `Observações:\n${t.observacoes}\n`;
        }

        texto += "\n";

    });

}

texto += "=============================\n";
texto += "PROVAS\n";
texto += "=============================\n\n";

if (!processo.provas.length) {

    texto += "Nenhuma prova registrada.\n\n";

} else {

    processo.provas.forEach((p, index) => {

        texto += `${index + 1}. Tipo: ${p.tipo}\n`;
        texto += `Descrição: ${p.descricao}\n`;

        if (p.link) {
            texto += `Link: ${p.link}\n`;
        }

        texto += "\n";

    });

}

texto += "=============================\n";
texto += "HISTÓRICO\n";
texto += "=============================\n\n";

processo.historico.forEach((h, index) => {

    texto += `${index + 1}. ${h.acao}\n`;

    if (h.detalhes) {
        texto += `${h.detalhes}\n`;
    }

    texto += "\n";

});

    return texto;
}

module.exports = {
    gerarTextoRelatorio,
};