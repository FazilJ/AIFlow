const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "gemini",
        "whatsapp",
        "widget",
        "mongodb",
        "postgresql",
        "redis",
      ],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "connected",
        "configured",
        "disconnected",
      ],
      default: "disconnected",
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

integrationSchema.index(
  { business: 1, type: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Integration ||
  mongoose.model(
    "Integration",
    integrationSchema
  );