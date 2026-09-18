const {
  getSettings,
  updateProfile,
  updateWorkspace,
  updatePassword,
  updateNotifications,
} = require("../service/settingsService");

// ======================================================
// GET SETTINGS
// ======================================================

const getUserSettings = async (req, res) => {
  try {
    const businessId = req.requestedBusinessId;

    const data = await getSettings({
      userId: req.user._id,
      businessId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get settings error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to load settings",
    });
  }
};

// ======================================================
// UPDATE PROFILE
// ======================================================

const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const profile = await updateProfile({
      userId: req.user._id,
      name,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to update profile",
    });
  }
};

// ======================================================
// UPDATE WORKSPACE
// ======================================================

const updateBusinessWorkspace = async (req, res) => {
  try {
    const workspace =
      await updateWorkspace({
        businessId: req.requestedBusinessId,
        ...req.body,
      });

    return res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
    });
  } catch (error) {
    console.error(
      "Update workspace error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to update workspace",
    });
  }
};

// ======================================================
// UPDATE PASSWORD
// ======================================================

const updateUserPassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    await updatePassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(
      "Update password error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to update password",
    });
  }
};

const updateNotificationsController = async (req, res) => {
  try {
    const {
      email,
      handoff,
      ticket,
      aiErrors,
    } = req.body;

    const data = await updateNotifications({
      userId: req.user._id,
      email,
      handoff,
      ticket,
      aiErrors,
    });

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Update notifications error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to update notification settings",
    });
  }
};

module.exports = {
  getUserSettings,
  updateUserProfile,
  updateBusinessWorkspace,
  updateUserPassword,
  updateNotificationsController,
};