const mongoose = require("mongoose");

const viaturaSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        membros: {
            type: [String],
            default: []
        },

        messageId: {
            type: String,
            default: null
        },

        channelId: {
            type: String,
            default: null
        },

        entrada: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        lider: {
            type: String,
            default: null
        },

        inicio: {
            type: Date,
            default: null
        },

        prisoes: {
            type: Number,
            default: 0
        },

        dinheiro: {
            type: Number,
            default: 0
        },

        ocorrencias: {
            type: Number,
            default: 0
        },

        tempoIndividual: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        historicoEntradas: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        historicoSaidas: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
,

        confirmacao: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports =
    mongoose.models.Viatura ||
    mongoose.model("Viatura", viaturaSchema);