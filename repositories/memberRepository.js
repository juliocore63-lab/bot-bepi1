const Member = require("../models/Member");

async function get(id) {
    return await Member.findOne({ id });
}

async function create(id, nome = "") {
    return await Member.create({
        id,
        nome
    });
}

async function getOrCreate(id, nome = "") {
    let membro = await get(id);

    if (!membro) {
        membro = await create(id, nome);
    }

    return membro;
}

async function save(membro) {
    return await membro.save();
}

module.exports = {
    get,
    create,
    getOrCreate,
    save
};