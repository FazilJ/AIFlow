const express = require("express");

const {
  createNewTicket,
  getAllTickets,
  getSingleTicket,
} = require("../controllers/ticketController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  createNewTicket
);

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getAllTickets
);

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  getSingleTicket
);

module.exports = router;