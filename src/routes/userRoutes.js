const express = require("express");

const {
  getSupportAgents,
  getSupportAgentById,
  assignBusinessToSupportAgent,
  removeBusinessFromSupportAgent,
  getAssignedBusinesses,
} = require("../controllers/userController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// SUPPORT AGENT LIST
// Admin only
// ======================================================
router.get(
  "/support-agents",
  protect,
  authorize("admin"),
  getSupportAgents
);

// ======================================================
// GET ONE SUPPORT AGENT
// Admin only
// ======================================================
router.get(
  "/support-agents/:userId",
  protect,
  authorize("admin"),
  getSupportAgentById
);

// ======================================================
// GET ASSIGNED BUSINESSES
// Admin only
// ======================================================
router.get(
  "/support-agents/:userId/businesses",
  protect,
  authorize("admin"),
  getAssignedBusinesses
);

// ======================================================
// ASSIGN BUSINESS
// Admin only
// ======================================================
router.post(
  "/support-agents/:userId/businesses",
  protect,
  authorize("admin"),
  assignBusinessToSupportAgent
);

// ======================================================
// REMOVE BUSINESS
// Admin only
// ======================================================
router.delete(
  "/support-agents/:userId/businesses/:businessId",
  protect,
  authorize("admin"),
  removeBusinessFromSupportAgent
);

module.exports = router;