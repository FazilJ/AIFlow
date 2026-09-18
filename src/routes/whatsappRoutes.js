const express = require("express");

const {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
  getWhatsAppStatus,
} = require("../controllers/whatsappController");

const router = express.Router();

// WhatsApp connection status
router.get("/status", getWhatsAppStatus);

// Meta webhook verification
router.get("/webhook", verifyWhatsAppWebhook);

// Meta incoming webhook
router.post("/webhook", handleWhatsAppWebhook);

module.exports = router;