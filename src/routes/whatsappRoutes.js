const express = require("express");

const {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
} = require("../controllers/whatsappController");

const router = express.Router();

// Meta webhook verification
router.get("/webhook", verifyWhatsAppWebhook);

// Incoming WhatsApp messages
router.post("/webhook", handleWhatsAppWebhook);

module.exports = router;