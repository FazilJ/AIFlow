const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");
const Business = require("../models/Business");
const Message = require("../models/Message");

// ======================================================
// Helper: Create standard service error
// ======================================================
const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ======================================================
// Helper: Validate ObjectId
// ======================================================
const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createServiceError(`Invalid ${fieldName}`, 400);
  }
};

// ======================================================
// Create Conversation
// ======================================================
const createConversation = async (
  conversationData,
  userId,
  role
) => {
  const { business, customer, channel } = conversationData;

  // -----------------------------
  // Validate required fields
  // -----------------------------
  if (!business) {
    throw createServiceError("Business ID is required", 400);
  }

  if (!customer) {
    throw createServiceError("Customer ID is required", 400);
  }

  if (!channel) {
    throw createServiceError("Channel is required", 400);
  }

  validateObjectId(business, "business ID");
  validateObjectId(customer, "customer ID");

  // -----------------------------
  // Support agents cannot create
  // conversations directly
  // -----------------------------
  if (role === "support_agent") {
    throw createServiceError(
      "Support agents cannot create conversations directly",
      403
    );
  }

  // -----------------------------
  // Check business access
  // -----------------------------
  let businessExists;

  if (role === "admin") {
    businessExists = await Business.findById(business)
      .select("_id name email owner isActive")
      .lean();
  } else if (role === "business_owner") {
    businessExists = await Business.findOne({
      _id: business,
      owner: userId,
    })
      .select("_id name email owner isActive")
      .lean();
  } else {
    throw createServiceError(
      "You do not have permission to create conversations",
      403
    );
  }

  if (!businessExists) {
    throw createServiceError(
      "Business not found or access denied",
      404
    );
  }

  // -----------------------------
  // Check active business
  // -----------------------------
  if (businessExists.isActive === false) {
    throw createServiceError(
      "This business is inactive",
      403
    );
  }

  // -----------------------------
  // Check customer belongs
  // to this business
  // -----------------------------
  const customerExists = await Customer.findOne({
    _id: customer,
    business,
  })
    .select("_id name email business")
    .lean();

  if (!customerExists) {
    throw createServiceError(
      "Customer not found for this business",
      404
    );
  }

  // -----------------------------
  // Create conversation
  // -----------------------------
  const conversation = await Conversation.create({
    business,
    customer,
    channel,
    status: "open",
    lastMessageAt: new Date(),
  });

  return conversation;
};

// ======================================================
// Get Conversations
// ======================================================
const getConversations = async (userId, role) => {
  let query = {};

  // -----------------------------
  // Admin
  // -----------------------------
  if (role === "admin") {
    query = {};
  }

  // -----------------------------
  // Business Owner
  // -----------------------------
  else if (role === "business_owner") {
    const businesses = await Business.find({
      owner: userId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    const businessIds = businesses.map(
      (business) => business._id
    );

    // No businesses
    if (businessIds.length === 0) {
      return [];
    }

    query = {
      business: {
        $in: businessIds,
      },
    };
  }

  // -----------------------------
  // Support Agent
  // Only assigned conversations
  // -----------------------------
  else if (role === "support_agent") {
    query = {
      assignedTo: userId,
    };
  }

  // -----------------------------
  // Unknown role
  // -----------------------------
  else {
    throw createServiceError(
      "You do not have permission to view conversations",
      403
    );
  }

  const conversations = await Conversation.find(query)
    .populate("business", "name email")
    .populate("customer", "name email phone")
    .populate("assignedTo", "name email")
    .sort({ lastMessageAt: -1 });

  return conversations;
};

// ======================================================
// Get One Conversation
// ======================================================
const getConversationById = async (
  conversationId,
  userId,
  role
) => {
  validateObjectId(conversationId, "conversation ID");

  let query = {
    _id: conversationId,
  };

  // -----------------------------
  // Admin
  // -----------------------------
  if (role === "admin") {
    // no additional restriction
  }

  // -----------------------------
  // Business Owner
  // -----------------------------
  else if (role === "business_owner") {
    const businesses = await Business.find({
      owner: userId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    const businessIds = businesses.map(
      (business) => business._id
    );

    if (businessIds.length === 0) {
      return null;
    }

    query.business = {
      $in: businessIds,
    };
  }

  // -----------------------------
  // Support Agent
  // Only assigned conversation
  // -----------------------------
  else if (role === "support_agent") {
    query.assignedTo = userId;
  }

  // -----------------------------
  // Unknown role
  // -----------------------------
  else {
    throw createServiceError(
      "You do not have permission to view this conversation",
      403
    );
  }

  const conversation = await Conversation.findOne(query)
    .populate("business", "name email")
    .populate("customer", "name email phone")
    .populate("assignedTo", "name email");

  return conversation;
};

// ======================================================
// Find or Create WhatsApp Conversation
// ======================================================
const findOrCreateWhatsAppConversation = async ({
  businessId,
  customerId,
}) => {
  if (!businessId || !customerId) {
    throw createServiceError(
      "Business ID and Customer ID are required",
      400
    );
  }

  validateObjectId(businessId, "business ID");
  validateObjectId(customerId, "customer ID");

  // -----------------------------
  // Verify business exists
  // -----------------------------
  const businessExists = await Business.findOne({
    _id: businessId,
    isActive: { $ne: false },
  })
    .select("_id")
    .lean();

  if (!businessExists) {
    throw createServiceError(
      "Business not found or inactive",
      404
    );
  }

  // -----------------------------
  // Verify customer belongs
  // to this business
  // -----------------------------
  const customerExists = await Customer.findOne({
    _id: customerId,
    business: businessId,
  })
    .select("_id")
    .lean();

  if (!customerExists) {
    throw createServiceError(
      "Customer not found for this business",
      404
    );
  }

  // -----------------------------
  // Find existing open WhatsApp
  // conversation
  // -----------------------------
  let conversation = await Conversation.findOne({
    business: businessId,
    customer: customerId,
    channel: "whatsapp",
    status: "open",
  }).sort({
    lastMessageAt: -1,
  });

  // -----------------------------
  // Create if not exists
  // -----------------------------
  if (!conversation) {
    conversation = await Conversation.create({
      business: businessId,
      customer: customerId,
      channel: "whatsapp",
      status: "open",
      lastMessageAt: new Date(),
    });
  }

  return conversation;
};

// ======================================================
// Add Message
// ======================================================
const addMessage = async (
  conversationId,
  messageData,
  userId,
  role
) => {
  // -----------------------------
  // Validate message data
  // -----------------------------
  if (!messageData) {
    throw createServiceError(
      "Message data is required",
      400
    );
  }

  if (!messageData.content || !messageData.content.trim()) {
    throw createServiceError(
      "Message content is required",
      400
    );
  }

  if (!messageData.senderType) {
    throw createServiceError(
      "Sender type is required",
      400
    );
  }

  // -----------------------------
  // Get accessible conversation
  // -----------------------------
  const conversation = await getConversationById(
    conversationId,
    userId,
    role
  );

  if (!conversation) {
    throw createServiceError(
      "Conversation not found or access denied",
      404
    );
  }

  // -----------------------------
  // Create message
  // -----------------------------
  const message = await Message.create({
    conversation: conversation._id,
    senderType: messageData.senderType,
    sender: messageData.sender || null,
    content: messageData.content.trim(),
    messageType: messageData.messageType || "text",
    aiMetadata: messageData.aiMetadata || undefined,
  });

  // -----------------------------
  // Update conversation timestamp
  // -----------------------------
  await Conversation.findByIdAndUpdate(
    conversationId,
    {
      lastMessageAt: new Date(),
    }
  );

  return message;
};

// ======================================================
// Exports
// ======================================================
module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  addMessage,
  findOrCreateWhatsAppConversation,
};  