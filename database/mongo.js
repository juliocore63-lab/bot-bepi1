const mongoose = require("mongoose");

async function connectMongo() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "A variável MONGO_URI não foi configurada no arquivo .env."
    );
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB conectado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    throw error;
  }
}

module.exports = {
  connectMongo,
};