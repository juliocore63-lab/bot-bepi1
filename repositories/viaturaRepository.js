const Viatura = require("../models/Viatura");

async function get(nome) {
    const nomeFormatado = nome.toUpperCase().trim();

    return Viatura.findOne({
        nome: nomeFormatado
    });
}

async function create(nome) {
    const nomeFormatado = nome.toUpperCase().trim();

    return Viatura.create({
        nome: nomeFormatado,
        membros: [],
        messageId: null,
        channelId: null,
        entrada: {},
        lider: null,
        inicio: null,
        prisoes: 0,
        dinheiro: 0,
        ocorrencias: 0,
        tempoIndividual: {},
        historicoEntradas: [],
        historicoSaidas: []
    });
}

async function getOrCreate(nome) {
    const nomeFormatado = nome.toUpperCase().trim();

    let viatura = await get(nomeFormatado);

    if (!viatura) {
        viatura = await create(nomeFormatado);
    }

    return viatura;
}

async function save(viatura) {
    return viatura.save();
}

async function remove(nome) {
    const nomeFormatado = nome.toUpperCase().trim();

    return Viatura.deleteOne({
        nome: nomeFormatado
    });
}

async function getAll() {
    return Viatura.find({});
}

module.exports = {
    get,
    create,
    getOrCreate,
    save,
    remove,
    getAll
};