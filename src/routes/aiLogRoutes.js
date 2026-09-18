const express = require("express");

const {
  getAILogsData,
} = require("../controllers/aiLogController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "business_owner", "support_agent"),
  getAILogsData
);

module.exports = router;