const conversationService = require("../service/conversationService");

// ===============================
// Create Conversation
// ===============================
const createConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.createConversation(
      req.body,
      req.user._id,
      req.user.role
    );

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get All Conversations
// ===============================
const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getConversations(
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get Conversation By ID
// ===============================
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Add Message
// ===============================
const addMessage = async (req, res, next) => {
  try {
    const message = await conversationService.addMessage(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );

    res.status(201).json({
      success: true,
      message: "Message added successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  addMessage,
};