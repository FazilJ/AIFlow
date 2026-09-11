const express = require("express");

const {
  createCustomer,
  getCustomers,
  identifyCustomer,
} = require("../controllers/customerController");

const { protect } = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// PROTECTED CUSTOMER ROUTES
// ======================================================

// Admin and business owners can create customers
router.post(
  "/",
  protect,
  authorize("admin", "business_owner"),
  createCustomer
);

// Admin, business owners and support agents can view customers
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getCustomers
);

// ======================================================
// PUBLIC WIDGET CUSTOMER IDENTIFICATION
// ======================================================

router.post(
  "/identify",
  identifyCustomer
);

module.exports = router;