const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
    {
        chave: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        valor: {
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
    mongoose.models.Config ||
    mongoose.model("Config", configSchema);