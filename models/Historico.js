const mongoose = require("mongoose");

const historicoSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: null,
            index: true
        },

        tipo: {
            type: String,
            default: null
        },

        valor: {
            type: Number,
            default: 0
        },

        numero: {
            type: String,
            default: null
        },

        data: {
            type: Date,
            default: Date.now
        },

        viatura: {
            type: String,
            default: null
        },

        comandante: {
            type: String,
            default: null
        },

        equipe: {
            type: [String],
            default: []
        },

        tempo: {
            type: String,
            default: null
        },

        prisoes: {
            type: Number,
            default: 0
        },

        ocorrencias: {
            type: Number,
            default: 0
        },

        dinheiro: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports =
    mongoose.models.Historico ||
    mongoose.model("Historico", historicoSchema);