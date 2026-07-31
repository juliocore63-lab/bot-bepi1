const { CorregedoriaProcesso, CorregedoriaContador } = require("../models");

function formatarCodigo(numero) {
  return `PROC-${String(numero).padStart(6, "0")}`;
}

async function proximoNumero(guildId) {
  const contador = await CorregedoriaContador.findOneAndUpdate(
    { guildId },
    { $inc: { ultimoNumero: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return contador.ultimoNumero;
}

async function criarProcesso({
  guildId,
  investigadoId,
  responsavelId,
  tipo,
  motivo,
  observacoes,
}) {
  const numero = await proximoNumero(guildId);
  const codigo = formatarCodigo(numero);

  return CorregedoriaProcesso.create({
    guildId,
    numero,
    codigo,
    investigadoId,
    responsavelId,
    tipo,
    motivo,
    observacoes,
    historico: [
      {
        acao: "PROCESSO_CRIADO",
        autorId: responsavelId,
        detalhes: `Processo ${codigo} criado.`,
      },
    ],
  });
}

async function vincularCanal(processoId, canalId, mensagemPainelId) {
  return CorregedoriaProcesso.findByIdAndUpdate(
    processoId,
    { canalId, mensagemPainelId },
    { new: true }
  );
}

async function buscarPorCodigo(guildId, codigo) {
  return CorregedoriaProcesso.findOne({
    guildId,
    codigo: String(codigo || "").trim().toUpperCase(),
  });
}

async function buscarPorId(processoId) {
  return CorregedoriaProcesso.findById(processoId);
}

async function estatisticas(guildId) {
  const [total, emAndamento, concluidos, arquivados] = await Promise.all([
    CorregedoriaProcesso.countDocuments({ guildId }),
    CorregedoriaProcesso.countDocuments({
      guildId,
      status: {
        $in: ["EM_ANALISE", "EM_DILIGENCIA", "AGUARDANDO_DEPOIMENTO", "CONCLUSO"],
      },
    }),
    CorregedoriaProcesso.countDocuments({ guildId, status: "CONCLUIDO" }),
    CorregedoriaProcesso.countDocuments({ guildId, status: "ARQUIVADO" }),
  ]);

  return { total, emAndamento, concluidos, arquivados };
}

async function registrarIntimacao(processoId, dados) {
  const processo = await CorregedoriaProcesso.findById(processoId);

  if (!processo) {
    throw new Error("Processo não encontrado.");
  }

  if (processo.status === "ARQUIVADO") {
    throw new Error("Não é possível intimar em um processo arquivado.");
  }

  processo.intimacoes.push({
    tipo: dados.tipo,
    destinatarioId: dados.destinatarioId,
    data: dados.data,
    horario: dados.horario,
    local: dados.local,
    orientacoes: dados.orientacoes || "",
    criadoPorId: dados.criadoPorId,
    enviadaPorDm: false,
  });

  processo.historico.push({
    acao:
      dados.tipo === "DEPOIMENTO"
        ? "INTIMACAO_DEPOIMENTO"
        : "INTIMACAO_INVESTIGADO",
    autorId: dados.criadoPorId,
    detalhes: `Destinatário: ${dados.destinatarioId}. Intimação marcada para ${dados.data}, às ${dados.horario}, em ${dados.local}.`,
  });

  if (dados.tipo === "DEPOIMENTO") {
    processo.status = "AGUARDANDO_DEPOIMENTO";
  }

  await processo.save();

  return processo;
}

async function registrarDepoimento(processoId, dados) {
  const processo = await CorregedoriaProcesso.findById(processoId);

  if (!processo) {
    throw new Error("Processo não encontrado.");
  }

  if (processo.status === "ARQUIVADO") {
    throw new Error(
      "Não é possível registrar depoimento em um processo arquivado."
    );
  }

  processo.depoimentos.push({
    depoenteId: dados.depoenteId,
    data: dados.data,
    horario: dados.horario,
    local: dados.local,
    resumo: dados.resumo,
    observacoes: dados.observacoes || "",
    registradoPorId: dados.registradoPorId,
    mensagemCanalId: null,
  });

  processo.historico.push({
    acao: "DEPOIMENTO_REGISTRADO",
    autorId: dados.registradoPorId,
    detalhes:
      `Depoimento de ${dados.depoenteId} registrado em ` +
      `${dados.data}, às ${dados.horario}, em ${dados.local}.`,
  });

  await processo.save();

  return processo;
}

async function registrarTestemunha(processoId, dados) {
  const processo = await CorregedoriaProcesso.findById(processoId);

  if (!processo) {
    throw new Error("Processo não encontrado.");
  }

  if (processo.status === "ARQUIVADO") {
    throw new Error(
      "Não é possível registrar testemunhas em um processo arquivado."
    );
  }

  processo.testemunhas.push({
    testemunhaId: dados.testemunhaId,
    data: dados.data,
    horario: dados.horario,
    resumo: dados.resumo,
    observacoes: dados.observacoes || "",
    registradoPorId: dados.registradoPorId,
  });

  processo.historico.push({
    acao: "TESTEMUNHA_REGISTRADA",
    autorId: dados.registradoPorId,
    detalhes:
      `Testemunha ${dados.testemunhaId} registrada em ` +
      `${dados.data}, às ${dados.horario}.`,
  });

  await processo.save();

  return processo;
}

async function registrarProva(processoId, dados) {
  const processo = await CorregedoriaProcesso.findById(processoId);

  if (!processo) {
    throw new Error("Processo não encontrado.");
  }

  if (processo.status === "ARQUIVADO") {
    throw new Error(
      "Não é possível adicionar provas em um processo arquivado."
    );
  }

  processo.provas.push({
    tipo: dados.tipo,
    nome: dados.nome,
    url: dados.url,
    contentType: dados.contentType || "",
    tamanho: dados.tamanho || 0,
    autorId: dados.autorId,
    mensagemId: dados.mensagemId,
    canalId: dados.canalId,
  });

  processo.historico.push({
    acao: "PROVA_ADICIONADA",
    autorId: dados.autorId,
    detalhes: `Prova adicionada: ${dados.nome} (${dados.tipo}).`,
  });

  await processo.save();

  return processo;
}

async function alterarStatus(processoId, novoStatus, autorId) {
    const processo = await CorregedoriaProcesso.findById(processoId);

    if (!processo) {
        throw new Error("Processo não encontrado.");
    }

    const statusAnterior = processo.status;

    processo.status = novoStatus;

    processo.historico.push({
        acao: "STATUS_ALTERADO",
        autorId,
        detalhes: `${statusAnterior} -> ${novoStatus}`,
    });

    await processo.save();

    return processo;
}

async function arquivarProcesso(processoId, autorId) {

  const processo = await CorregedoriaProcesso.findById(processoId);

  if (!processo) {
    throw new Error("Processo não encontrado.");
  }

  processo.status = "ARQUIVADO";
  processo.canalId = null;
  processo.mensagemPainelId = null;

  processo.historico.push({
    acao: "PROCESSO_ARQUIVADO",
    autorId,
    detalhes: "Processo arquivado pela Corregedoria.",
  });

  await processo.save();

  return processo;
}

module.exports = {
  criarProcesso,
  vincularCanal,
  buscarPorCodigo,
  buscarPorId,
  estatisticas,
  formatarCodigo,
  arquivarProcesso,
  registrarIntimacao,
  registrarDepoimento,
  registrarTestemunha,
  registrarProva,
  alterarStatus,
};
