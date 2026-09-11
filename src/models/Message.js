const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
      index: true,
    },

    senderType: {
      type: String,
      enum: ["customer", "ai", "agent", "system"],
      required: [true, "Sender type is required"],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio"],
      default: "text",
    },

    aiMetadata: {
      model: {
        type: String,
        default: null,
      },

      tokensUsed: {
        type: Number,
        default: 0,
      },

      toolCalled: {
        type: String,
        default: null,
      },

      confidence: {
        type: Number,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

module.exports = mongoose.model("Message", messageSchema);