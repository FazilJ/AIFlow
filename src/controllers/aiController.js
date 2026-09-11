const aiService = require("../service/aiService");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const {
  customerLookup,
} = require("../tools/customerTool");

const chatWithAI = async (req, res, next) => {
  try {
    const {
      message,
      conversationId,
      businessId,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // If conversationId is provided,
    // use existing conversation
    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findById(
        conversationId
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    }

    const aiBusinessId =
      conversation?.business || businessId;

    if (!aiBusinessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    // Get previous messages
    let conversationHistory = [];

    if (conversation) {
      conversationHistory = await Message.find({
        conversation: conversation._id,
      })
        .sort({ createdAt: 1 })
        .limit(20);
    }

    // Save customer message
    let customerMessage = null;

    if (conversation) {
      customerMessage = await Message.create({
        conversation: conversation._id,
        senderType: "customer",
        content: message,
        messageType: "text",
      });
    }

    // Generate AI response
    const reply = await aiService.generateAIReply(
      message,
      conversationHistory,
      aiBusinessId
    );

    // Save AI message
    let aiMessage = null;

    if (conversation) {
      aiMessage = await Message.create({
        conversation: conversation._id,
        senderType: "ai",
        content: reply,
        messageType: "text",
        aiMetadata: {
          model: "gemini-3.6-flash",
        },
      });

      await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          lastMessageAt: new Date(),
        }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        customerMessage,
        aiMessage,
        conversationId:
          conversation?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const lookupCustomer = async (req, res, next) => {
  try {
    const {
      email,
      phone,
      whatsappNumber,
    } = req.body;

    const result = await customerLookup({
      email,
      phone,
      whatsappNumber,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const widgetChatWithAI = async (req, res, next) => {
  try {
    const {
      message,
      conversationId,
      businessId,
      customerId,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    let conversation = null;

    // Existing conversation
    if (conversationId) {
      conversation = await Conversation.findById(
        conversationId
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    }

    // Create conversation for first widget message
    if (!conversation) {
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required for a new conversation",
        });
      }

      conversation = await Conversation.create({
        business: businessId,
        customer: customerId,
        status: "open",
        channel: "website",
        lastMessageAt: new Date(),
      });
    }

    const aiBusinessId =
      conversation.business || businessId;

    // Get previous messages
    let conversationHistory = [];

    if (conversation) {
      conversationHistory = await Message.find({
        conversation: conversation._id,
      })
        .sort({ createdAt: 1 })
        .limit(20);
    }

    // Save customer message
    const customerMessage = await Message.create({
      conversation: conversation._id,
      senderType: "customer",
      content: message.trim(),
      messageType: "text",
    });

    // Generate AI response
    const reply =
      await aiService.generateAIReply(
        message.trim(),
        conversationHistory,
        aiBusinessId
      );

    // Save AI message
    const aiMessage = await Message.create({
      conversation: conversation._id,
      senderType: "ai",
      content: reply,
      messageType: "text",
      aiMetadata: {
        model: "gemini-3.6-flash",
      },
    });

    await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        lastMessageAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      data: {
        reply,
        customerMessage,
        aiMessage,
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  lookupCustomer,
  widgetChatWithAI,
};
