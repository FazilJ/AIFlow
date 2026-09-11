const mongoose = require("mongoose");

const widgetSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Widget name is required"],
      trim: true,
    },

    welcomeMessage: {
      type: String,
      trim: true,
      default: "Hi! How can I help you today?",
    },

    primaryColor: {
      type: String,
      default: "#2563eb",
    },

    position: {
      type: String,
      enum: ["bottom-right", "bottom-left"],
      default: "bottom-right",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    allowedDomains: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

widgetSchema.index({
  business: 1,
  isActive: 1,
});

module.exports =
  mongoose.models.Widget ||
  mongoose.model("Widget", widgetSchema);   