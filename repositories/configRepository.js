const Config = require("../models/Config");

async function get(chave) {
    return Config.findOne({ chave });
}

async function set(chave, valor) {
    return Config.findOneAndUpdate(
        { chave },
        { $set: { valor } },
        {
            upsert: true,
            returnDocument: "after"
        }
    );
}

module.exports = {
    get,
    set
};