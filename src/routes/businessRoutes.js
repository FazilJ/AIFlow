const express = require("express");

const {
  createBusiness,
  getBusinesses,
  getBusinessById,
} = require("../controllers/businessController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("business_owner", "admin"),
  createBusiness
);

router.get(
  "/",
  protect,
  getBusinesses
);

router.get(
  "/:id",
  protect,
  getBusinessById
);

module.exports = router;