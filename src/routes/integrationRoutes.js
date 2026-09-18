const express = require("express");

const {
  getIntegrationList,
  configureIntegration,
} = require("../controllers/integrationController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const {
  checkBusinessAccess,
} = require("../middleware/businessAccessMiddleware");

const router = express.Router();

// GET integrations
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  checkBusinessAccess("query"),
  getIntegrationList
);

// Configure integration
router.patch(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  checkBusinessAccess("body"),
  configureIntegration
);

module.exports = router;