const express = require("express");

const {
  createConversation,
  getConversations,
  getConversationById,
  addMessage,
} = require("../controllers/conversationController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE CONVERSATION
// ======================================================
// Admin + Business Owner only
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  createConversation
);

// ======================================================
// GET ALL CONVERSATIONS
// ======================================================
// Admin + Business Owner + Support Agent
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getConversations
);

// ======================================================
// GET SINGLE CONVERSATION
// ======================================================
router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getConversationById
);

// ======================================================
// ADD MESSAGE
// ======================================================
router.post(
  "/:id/messages",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  addMessage
);

module.exports = router;  