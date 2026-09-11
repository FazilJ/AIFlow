const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const getConversationHistory = async (
  conversationId,
  limit = 10
) => {
  try {
    if (!conversationId) {
      return [];
    }

    const conversation =
      await Conversation.findById(
        conversationId
      ).lean();

    if (!conversation) {
      return [];
    }

    const messages =
      await Message.find({
        conversation: conversationId,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(
          "senderType content createdAt"
        )
        .lean();

    return messages.reverse();
  } catch (error) {
    console.error(
      "Conversation Memory Error:",
      error
    );

    return [];
  }
};

const formatConversationHistory = (
  messages
) => {
  if (
    !messages ||
    messages.length === 0
  ) {
    return "";
  }

  return messages
    .map((message) => {
      const role =
        message.senderType === "customer"
          ? "Customer"
          : message.senderType === "ai"
          ? "AI Assistant"
          : "Agent";

      return `${role}: ${message.content}`;
    })
    .join("\n");
};

module.exports = {
  getConversationHistory,
  formatConversationHistory,
};