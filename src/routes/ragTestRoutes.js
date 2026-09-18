const express = require("express");

const { runRagTest } = require("../controllers/ragTestController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  runRagTest
);

module.exports = router;