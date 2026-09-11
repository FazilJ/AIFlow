const express = require("express");

const {
  createWidget,
  getPublicWidget,
} = require("../controllers/widgetController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE WIDGET
// ======================================================

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  createWidget
);

// ======================================================
// PUBLIC WIDGET
// ======================================================

router.get(
  "/public/:widgetId",
  getPublicWidget
);

module.exports = router;