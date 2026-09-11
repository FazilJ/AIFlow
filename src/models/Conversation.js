const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "pending", "resolved", "closed"],
      default: "open",
      index: true,
    },

    channel: {
      type: String,
      enum: ["website", "whatsapp", "instagram", "facebook"],
      default: "website",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  business: 1,
  customer: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);