const express = require("express");

const {
  getTeam,
  addTeamMember,
  removeMember,
  changeMemberRole,
} = require("../controllers/teamController");

const { protect } = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const {
  checkBusinessAccess,
} = require("../middleware/businessAccessMiddleware");

const router = express.Router();

/*
 * Get team members
 *
 * Business ID comes from:
 * ?businessId=...
 */
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  checkBusinessAccess("query"),
  getTeam
);

/*
 * Add team member
 *
 * Business ID comes from:
 * req.body.businessId
 */
router.post(
  "/",
  protect,
  authorize("admin", "business_owner"),
  checkBusinessAccess("body"),
  addTeamMember
);

/*
 * Remove team member
 *
 * Business ID comes from:
 * req.body.businessId
 */
router.delete(
  "/:memberId",
  protect,
  authorize("admin", "business_owner"),
  checkBusinessAccess("body"),
  removeMember
);

/*
 * Change team member role
 *
 * Business ID comes from:
 * req.body.businessId
 */
router.patch(
  "/:memberId/role",
  protect,
  authorize("admin", "business_owner"),
  checkBusinessAccess("body"),
  changeMemberRole
);

module.exports = router;