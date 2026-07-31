const mongoose = require("mongoose");

const historicoSchema = new mongoose.Schema(
  {
    acao: { type: String, required: true },
    autorId: { type: String, required: true },
    detalhes: { type: String, default: "" },
    criadoEm: { type: Date, default: Date.now },
  },
  { _id: false }
);

const intimacaoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["INVESTIGADO", "DEPOIMENTO"],
      required: true,
    },

    destinatarioId: {
      type: String,
      required: true,
    },

    data: {
      type: String,
      required: true,
    },

    horario: {
      type: String,
      required: true,
    },

    local: {
      type: String,
      required: true,
    },

    orientacoes: {
      type: String,
      default: "",
    },

    criadoPorId: {
      type: String,
      required: true,
    },

    mensagemCanalId: {
      type: String,
      default: null,
    },

    enviadaPorDm: {
      type: Boolean,
      default: false,
    },

    criadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const depoimentoSchema = new mongoose.Schema(
  {
    depoenteId: {
      type: String,
      required: true,
    },

    data: {
      type: String,
      required: true,
    },

    horario: {
      type: String,
      required: true,
    },

    local: {
      type: String,
      required: true,
    },

    resumo: {
      type: String,
      required: true,
    },

    observacoes: {
      type: String,
      default: "",
    },

    registradoPorId: {
      type: String,
      required: true,
    },

    mensagemCanalId: {
      type: String,
      default: null,
    },

    criadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const testemunhaSchema = new mongoose.Schema(
  {
    testemunhaId: {
      type: String,
      required: true,
    },

    data: {
      type: String,
      required: true,
    },

    horario: {
      type: String,
      required: true,
    },

    resumo: {
      type: String,
      required: true,
    },

    observacoes: {
      type: String,
      default: "",
    },

    registradoPorId: {
      type: String,
      required: true,
    },

    criadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const provaSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["DOCUMENTO", "PDF", "IMAGEM", "VIDEO", "AUDIO", "OUTRO"],
      required: true,
    },

    nome: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      default: "",
    },

    tamanho: {
      type: Number,
      default: 0,
    },

    autorId: {
      type: String,
      required: true,
    },

    mensagemId: {
      type: String,
      required: true,
    },

    canalId: {
      type: String,
      required: true,
    },

    criadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const corregedoriaProcessoSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    numero: { type: Number, required: true },
    codigo: { type: String, required: true, index: true },
    canalId: { type: String, default: null },
    mensagemPainelId: { type: String, default: null },
    investigadoId: { type: String, required: true },
    responsavelId: { type: String, required: true },
    tipo: { type: String, required: true },
    motivo: { type: String, required: true },
    observacoes: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "EM_ANALISE",
        "EM_DILIGENCIA",
        "AGUARDANDO_DEPOIMENTO",
        "CONCLUSO",
        "CONCLUIDO",
        "ARQUIVADO",
      ],
      default: "EM_ANALISE",
      index: true,
    },
    historico: { type: [historicoSchema], default: [] },
    intimacoes: {
  type: [intimacaoSchema],
  default: [],
},
depoimentos: {
  type: [depoimentoSchema],
  default: [],
},

testemunhas: {
    type: [testemunhaSchema],
    default: [],
},

provas: {
  type: [provaSchema],
  default: [],
},
    arquivadoEm: { type: Date, default: null },
    concluidoEm: { type: Date, default: null },
  },
  { timestamps: true }
);

corregedoriaProcessoSchema.index({ guildId: 1, numero: 1 }, { unique: true });

const corregedoriaContadorSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true },
    ultimoNumero: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CorregedoriaProcesso =
  mongoose.models.CorregedoriaProcesso ||
  mongoose.model("CorregedoriaProcesso", corregedoriaProcessoSchema);

const CorregedoriaContador =
  mongoose.models.CorregedoriaContador ||
  mongoose.model("CorregedoriaContador", corregedoriaContadorSchema);

module.exports = {
  CorregedoriaProcesso,
  CorregedoriaContador,
};
