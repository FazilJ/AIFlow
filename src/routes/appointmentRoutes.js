const express = require("express");

const {
  createNewAppointment,
  getAllAppointments,
  getSingleAppointment,
} = require("../controllers/appointmentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create appointment
router.post(
  "/",
  protect,
  authorize("admin", "business_owner", "support_agent"),
  createNewAppointment
);

// Get all appointments
router.get(
  "/",
  protect,
  authorize("admin", "business_owner", "support_agent"),
  getAllAppointments
);

// Get single appointment
router.get(
  "/:id",
  protect,
  authorize("admin", "business_owner", "support_agent"),
  getSingleAppointment
);

module.exports = router;