const express = require("express");

const {
  getAnalyticsData,
} = require("../controllers/analyticsController");
const {
  protect,
} = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getAnalyticsData
);

module.exports = router;
