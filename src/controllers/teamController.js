const {
  getTeamMembers,
  createTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} = require("../service/teamService");

// ======================================================
// GET TEAM
// ======================================================

const getTeam = async (req, res) => {
  try {
    const businessId = req.requestedBusinessId;

    const members = await getTeamMembers(businessId);

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error(
      "Team fetch error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members",
    });
  }
};

// ======================================================
// ADD TEAM MEMBER
// ======================================================

const addTeamMember = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    // Business ID comes ONLY from
    // validated business access middleware
    const businessId =
      req.requestedBusinessId;

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !businessId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, role and businessId are required",
      });
    }

    const allowedRoles = [
      "business_owner",
      "support_agent",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Use business_owner or support_agent.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const member = await createTeamMember({
      name,
      email,
      password,
      role,
      businessId,
    });

    return res.status(201).json({
      success: true,
      message:
        "Team member added successfully",
      data: member,
    });
  } catch (error) {
    console.error(
      "Add team member error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to add team member",
    });
  }
};

// ======================================================
// REMOVE TEAM MEMBER
// ======================================================

const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const businessId =
      req.requestedBusinessId;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }

    // Prevent self-removal
    if (
      req.user._id &&
      req.user._id.toString() ===
        memberId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove yourself from the team",
      });
    }

    const member = await removeTeamMember({
      memberId,
      businessId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Team member removed successfully",
      data: member,
    });
  } catch (error) {
    console.error(
      "Remove team member error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to remove team member",
    });
  }
};

// ======================================================
// CHANGE TEAM MEMBER ROLE
// ======================================================

const changeMemberRole = async (
  req,
  res
) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const businessId =
      req.requestedBusinessId;

    if (!memberId || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID and role are required",
      });
    }

    // Prevent changing own role
    if (
      req.user._id &&
      req.user._id.toString() ===
        memberId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    const member =
      await updateTeamMemberRole({
        memberId,
        businessId,
        role,
      });

    return res.status(200).json({
      success: true,
      message:
        "Team member role updated successfully",
      data: member,
    });
  } catch (error) {
    console.error(
      "Change team role error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to update team member role",
    });
  }
};

module.exports = {
  getTeam,
  addTeamMember,
  removeMember,
  changeMemberRole,
};