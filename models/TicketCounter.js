const mongoose = require("mongoose");

const ticketCounterSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.TicketCounter ||
  mongoose.model("TicketCounter", ticketCounterSchema);