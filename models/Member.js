const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    nome: { type: String, default: "" },
    tempo: { type: Number, default: 0 },
    atividade: { type: Number, default: 0 },
    pontos: { type: Number, default: 0 },
    dinheiro: { type: Number, default: 0 },
    prisoes: { type: Number, default: 0 },
    ocorrencias: { type: Number, default: 0 },
    weeklyTime: { type: Number, default: 0 },
    lastPatrolAt: { type: Date, default: null },
    patrolStart: { type: Date, default: null },
    lastWeeklyReset: { type: Date, default: Date.now },
    ultimaAtualizacao: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Member || mongoose.model("Member", memberSchema);
