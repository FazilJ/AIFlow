const User = require("../models/User");
const Business = require("../models/Business");
const bcrypt = require("bcryptjs");

// ======================================================
// GET SETTINGS
// ======================================================

const getSettings = async ({ userId, businessId }) => {
  const user = await User.findById(userId)
    .select("name email role businesses notifications")
    .lean();

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const business = await Business.findOne({
    _id: businessId,
    isActive: true,
  })
    .select(
      "name email phone category description workingHours owner"
    )
    .lean();

  if (!business) {
    const error = new Error(
      "Business not found or access denied"
    );

    error.statusCode = 404;

    throw error;
  }

  return {
    profile: {
      name: user.name,
      email: user.email,
      role: user.role,
    },

    workspace: {
      id: business._id,
      name: business.name,
      email: business.email || "",
      phone: business.phone || "",
      category: business.category || "",
      description: business.description || "",
      workingHours: business.workingHours || {},
    },

notifications: user.notifications || {
  email: true,
  handoff: true,
  ticket: true,
  aiErrors: true,
},
  };
};

// ======================================================
// UPDATE PROFILE
// ======================================================

const updateProfile = async ({
  userId,
  name,
}) => {
  if (!name || !name.trim()) {
    const error = new Error(
      "Name is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: name.trim(),
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("name email role")
    .lean();

  if (!user) {
    const error = new Error("User not found");

    error.statusCode = 404;

    throw error;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

// ======================================================
// UPDATE WORKSPACE
// ======================================================

const updateWorkspace = async ({
  businessId,
  name,
  email,
  phone,
  category,
  description,
  workingHours,
}) => {
  const updateData = {};

  if (name !== undefined) {
    if (!name.trim()) {
      const error = new Error(
        "Workspace name is required"
      );

      error.statusCode = 400;

      throw error;
    }

    updateData.name = name.trim();
  }

  if (email !== undefined) {
    updateData.email = email.trim();
  }

  if (phone !== undefined) {
    updateData.phone = phone.trim();
  }

  if (category !== undefined) {
    updateData.category = category.trim();
  }

  if (description !== undefined) {
    updateData.description =
      description.trim();
  }

  if (workingHours !== undefined) {
    updateData.workingHours =
      workingHours;
  }

  const business =
    await Business.findOneAndUpdate(
      {
        _id: businessId,
        isActive: true,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "name email phone category description workingHours owner"
      )
      .lean();

  if (!business) {
    const error = new Error(
      "Business not found or access denied"
    );

    error.statusCode = 404;

    throw error;
  }

  return {
    id: business._id,
    name: business.name,
    email: business.email || "",
    phone: business.phone || "",
    category: business.category || "",
    description:
      business.description || "",
    workingHours:
      business.workingHours || {},
  };
};


const updateNotifications = async ({
  userId,
  email,
  handoff,
  ticket,
  aiErrors,
}) => {
  const notifications = {};

  if (email !== undefined) {
    notifications.email = Boolean(email);
  }

  if (handoff !== undefined) {
    notifications.handoff = Boolean(handoff);
  }

  if (ticket !== undefined) {
    notifications.ticket = Boolean(ticket);
  }

  if (aiErrors !== undefined) {
    notifications.aiErrors = Boolean(aiErrors);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      notifications,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("notifications")
    .lean();

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user.notifications;
};

// ======================================================
// UPDATE PASSWORD
// ======================================================

const updatePassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  if (!currentPassword || !newPassword) {
    const error = new Error(
      "Current password and new password are required"
    );

    error.statusCode = 400;

    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error(
      "New password must be at least 6 characters"
    );

    error.statusCode = 400;

    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error(
      "User not found"
    );

    error.statusCode = 404;

    throw error;
  }

  const isMatch =
    await bcrypt.compare(
      currentPassword,
      user.password
    );

  if (!isMatch) {
    const error = new Error(
      "Current password is incorrect"
    );

    error.statusCode = 401;

    throw error;
  }

  user.password = newPassword;

  await user.save();

  return {
    success: true,
  };
};

module.exports = {
  getSettings,
  updateProfile,
  updateWorkspace,
  updatePassword,
  updateNotifications,
};