const express = require("express");

const {
  getUserSettings,
  updateUserProfile,
  updateBusinessWorkspace,
  updateUserPassword,
  updateNotificationsController,
} = require("../controllers/settingsController");

const { protect } = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const {
  checkBusinessAccess,
} = require("../middleware/businessAccessMiddleware");

const router = express.Router();

// ======================================================
// GET SETTINGS
// ======================================================

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  checkBusinessAccess("query"),
  getUserSettings
);

// ======================================================
// UPDATE PROFILE
// ======================================================

router.patch(
  "/profile",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  updateUserProfile
);

// ======================================================
// UPDATE WORKSPACE
// ======================================================

router.patch(
  "/workspace",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  checkBusinessAccess("body"),
  updateBusinessWorkspace
);

router.patch(
  "/notifications",
  protect,
  authorize("admin", "business_owner", "support_agent"),
  updateNotificationsController
);

// ======================================================
// CHANGE PASSWORD
// ======================================================

router.patch(
  "/password",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  updateUserPassword
);

module.exports = router;
