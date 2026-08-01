const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },

    ticketId: {
      type: Number,
      required: true,
    },

    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    channelId: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["denuncia", "duvida", "transferencia"],
    },

    claimedBy: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },

    closedBy: {
      type: String,
      default: null,
    },

    closeReason: {
      type: String,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({
  guildId: 1,
  ownerId: 1,
  status: 1,
});

ticketSchema.index(
  {
    guildId: 1,
    ticketId: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.Ticket ||
  mongoose.model("Ticket", ticketSchema);