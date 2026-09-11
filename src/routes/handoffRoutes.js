const express = require("express");

const {
  createHandoff,
  createWidgetHandoff,
  getHandoffs,
  getHandoffById,
  assignHandoff,
  resolveHandoff,
  cancelHandoff,
} = require("../controllers/handoffController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// PUBLIC WIDGET HANDOFF
// ======================================================
router.post(
  "/widget",
  createWidgetHandoff
);

// ======================================================
// CREATE HANDOFF
// Admin + Business Owner
// ======================================================
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  createHandoff
);

// ======================================================
// GET ALL HANDOFFS
// Admin + Business Owner + Support Agent
// ======================================================
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getHandoffs
);

// ======================================================
// GET ONE HANDOFF
// Admin + Business Owner + Support Agent
// ======================================================
router.get(
  "/:handoffId",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getHandoffById
);

// ======================================================
// ASSIGN HANDOFF
// Admin + Business Owner
// ======================================================
router.patch(
  "/:handoffId/assign",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  assignHandoff
);

// ======================================================
// RESOLVE HANDOFF
// All authorized staff
// ======================================================
router.patch(
  "/:handoffId/resolve",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  resolveHandoff
);

// ======================================================
// CANCEL HANDOFF
// Admin + Business Owner
// ======================================================
router.patch(
  "/:handoffId/cancel",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  cancelHandoff
);

module.exports = router;