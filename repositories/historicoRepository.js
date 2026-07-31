const Historico = require("../models/Historico");

async function create(dados) {
    return Historico.create(dados);
}

async function getAll() {
    return Historico.find().sort({ createdAt: -1 });
}

async function getByUser(userId) {
    return Historico.find({ userId }).sort({ createdAt: -1 });
}

async function clear() {
    return Historico.deleteMany({});
}

module.exports = {
    create,
    getAll,
    getByUser,
    clear
};