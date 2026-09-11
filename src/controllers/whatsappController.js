const aiService = require("../service/aiService");
const Message = require("../models/Message");
const Business = require("../models/Business");

const customerService = require("../service/customerService");
const conversationService = require("../service/conversationService");

const {
  sendWhatsAppTextMessage,
} = require("../service/whatsappService");

const resolveWhatsAppBusinessId = async () => {
  const configuredBusinessId = process.env.WHATSAPP_BUSINESS_ID?.trim();

  if (/^[a-f\d]{24}$/i.test(configuredBusinessId || "")) {
    const configuredBusiness = await Business.findById(configuredBusinessId)
      .select("_id")
      .lean();

    if (configuredBusiness) {
      return configuredBusiness._id.toString();
    }

    console.warn(
      "WHATSAPP_BUSINESS_ID does not match an existing business. Trying the single active-business fallback."
    );
  } else if (configuredBusinessId) {
    console.warn(
      "WHATSAPP_BUSINESS_ID is not a valid MongoDB ObjectId. Trying the single active-business fallback."
    );
  }

  // Useful for a single-business deployment and local testing. Do not guess
  // when more than one business is active, because that could mix customer data.
  const activeBusinesses = await Business.find({ isActive: true })
    .select("_id")
    .limit(2)
    .lean();

  if (activeBusinesses.length === 1) {
    const businessId = activeBusinesses[0]._id.toString();
    console.warn(
      `Using the only active business (${businessId}) for this WhatsApp webhook. Set WHATSAPP_BUSINESS_ID to make the mapping explicit.`
    );
    return businessId;
  }

  return null;
};

// ======================================================
// VERIFY WHATSAPP WEBHOOK
// ======================================================

const verifyWhatsAppWebhook = async (req, res, next) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // ==================================================
    // VERIFY META WEBHOOK
    // ==================================================

    if (
      mode === "subscribe" &&
      token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      console.log(
        "WhatsApp webhook verified successfully ✅"
      );

      return res.status(200).send(challenge);
    }

    console.error(
      "WhatsApp webhook verification failed ❌"
    );

    return res.sendStatus(403);
  } catch (error) {
    next(error);
  }
};

// ======================================================
// HANDLE WHATSAPP WEBHOOK
// ======================================================

const handleWhatsAppWebhook = async (
  req,
  res,
  next
) => {
  try {
    const body = req.body;

    // ==================================================
    // LOG WEBHOOK
    // ==================================================

    console.log(
      "WhatsApp Webhook Received:",
      JSON.stringify(body, null, 2)
    );

    // ==================================================
    // VALIDATE WEBHOOK OBJECT
    // ==================================================

    if (
      !body ||
      body.object !== "whatsapp_business_account"
    ) {
      console.log(
        "Invalid WhatsApp webhook object."
      );

      return res.sendStatus(404);
    }

    // ==================================================
    // GET WEBHOOK DATA
    // ==================================================

    const entry = body.entry?.[0];

    const change = entry?.changes?.[0];

    const value = change?.value;

    const message = value?.messages?.[0];

    // ==================================================
    // IGNORE STATUS UPDATES
    // ==================================================

    if (!message) {
      console.log(
        "No incoming WhatsApp message found."
      );

      return res.sendStatus(200);
    }

    // ==================================================
    // EXTRACT MESSAGE DETAILS
    // ==================================================

    const from = message.from;

    const messageType = message.type;

    let messageText = "";

    // ==================================================
    // TEXT MESSAGE
    // ==================================================

    if (messageType === "text") {
      messageText =
        message.text?.body || "";
    }

    console.log(
      "WhatsApp From:",
      from
    );

    console.log(
      "WhatsApp Message Type:",
      messageType
    );

    console.log(
      "WhatsApp Message:",
      messageText
    );

    // ==================================================
    // IGNORE EMPTY / UNSUPPORTED MESSAGE
    // ==================================================

    if (!messageText.trim()) {
      console.log(
        "Ignoring empty or unsupported WhatsApp message."
      );

      return res.sendStatus(200);
    }

    // ==================================================
    // BUSINESS ID
    // ==================================================

    const businessId = await resolveWhatsAppBusinessId();

    if (!businessId) {
      console.error(
        "Unable to resolve a business for this WhatsApp webhook. Set WHATSAPP_BUSINESS_ID to an existing Business._id."
      );

      return res.sendStatus(200);
    }

    // ==================================================
    // CUSTOMER NAME
    // ==================================================

    const customerName =
      value?.contacts?.[0]?.profile?.name ||
      "WhatsApp Customer";

    console.log(
      "WhatsApp Customer Name:",
      customerName
    );

    // ==================================================
    // FIND OR CREATE CUSTOMER
    // ==================================================

    const customer =
      await customerService.identifyWhatsAppCustomer({
        businessId,
        name: customerName,
        whatsappNumber: from,
      });

    console.log(
      "WhatsApp Customer:",
      customer._id.toString()
    );

    // ==================================================
    // FIND OR CREATE CONVERSATION
    // ==================================================

    const conversation =
      await conversationService.findOrCreateWhatsAppConversation(
        {
          businessId,
          customerId: customer._id,
        }
      );

    // ==================================================
    // CONVERSATION ID
    // ==================================================

    const conversationId =
      conversation._id.toString();

    console.log(
      "WhatsApp Conversation ID:",
      conversationId
    );

    // ==================================================
    // GET PREVIOUS CONVERSATION HISTORY
    // ==================================================

    const conversationHistory =
      await Message.find({
        conversation: conversation._id,
      })
        .sort({ createdAt: 1 })
        .limit(20)
        .select(
          "senderType content createdAt"
        )
        .lean();

    console.log(
      "Previous conversation messages:",
      conversationHistory.length
    );

    // ==================================================
    // SAVE CUSTOMER MESSAGE
    // ==================================================

    const customerMessage =
      await Message.create({
        conversation: conversation._id,

        senderType: "customer",

        sender: null,

        content: messageText.trim(),

        messageType: "text",
      });

    console.log(
      "WhatsApp Customer Message Saved:",
      customerMessage._id.toString()
    );

    // ==================================================
    // UPDATE CONVERSATION
    // ==================================================

    await conversation.updateOne({
      lastMessageAt: new Date(),
    });

    // ==================================================
    // GENERATE AI REPLY
    // GEMINI + RAG + CONVERSATION HISTORY
    // ==================================================

    const aiReply =
      await aiService.generateAIReply(
        messageText.trim(),
        conversationHistory,
        businessId
      );

    console.log(
      "WhatsApp AI Reply:",
      aiReply
    );

    // ==================================================
    // SAVE AI MESSAGE
    // ==================================================

    const aiMessage =
      await Message.create({
        conversation: conversation._id,

        senderType: "ai",

        sender: null,

        content: aiReply,

        messageType: "text",

        aiMetadata: {
          model: "gemini-3.6-flash",
        },
      });

    console.log(
      "WhatsApp AI Message Saved:",
      aiMessage._id.toString()
    );

    // ==================================================
    // UPDATE CONVERSATION LAST MESSAGE
    // ==================================================

    await conversation.updateOne({
      lastMessageAt: new Date(),
    });

    // ==================================================
    // WHATSAPP CREDENTIALS
    // ==================================================

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID;

    // ==================================================
    // SEND AI REPLY TO WHATSAPP
    // ==================================================

    if (
      accessToken &&
      phoneNumberId
    ) {
      await sendWhatsAppTextMessage({
        to: from,

        message: aiReply,

        phoneNumberId,

        accessToken,
      });

      console.log(
        "WhatsApp AI reply sent successfully ✅"
      );
    } else {
      console.log(
        "WhatsApp credentials missing."
      );

      console.log(
        "AI reply saved but not sent to WhatsApp."
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return res.sendStatus(200);
  } catch (error) {
    // ==================================================
    // ERROR HANDLING
    // ==================================================

    // Meta retries non-2xx webhook responses. A stale local business mapping
    // is a configuration issue, not a transient delivery failure, so log an
    // actionable message and acknowledge this event.
    if (error.statusCode === 404 && error.message === "Business not found") {
      console.error(
        "WhatsApp webhook ignored: WHATSAPP_BUSINESS_ID does not match an existing Business._id. Update server/.env with the correct MongoDB Business ID."
      );

      return res.sendStatus(200);
    }

    console.error(
      "WhatsApp Webhook Error:",
      error
    );

    next(error);
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
};
