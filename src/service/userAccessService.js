const mongoose = require("mongoose");

const User = require("../models/User");
const Business = require("../models/Business");

// ======================================================
// Helper: Service Error
// ======================================================
const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ======================================================
// Get user's assigned business IDs
// ======================================================
const getUserBusinessIds = async (userId, role) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw createServiceError("Invalid user ID", 400);
  }

  // Admin -> all businesses
  if (role === "admin") {
    const businesses = await Business.find({
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    return businesses.map((business) => business._id);
  }

  // Business owner -> businesses owned by user
  if (role === "business_owner") {
    const businesses = await Business.find({
      owner: userId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    return businesses.map((business) => business._id);
  }

  // Support agent -> explicitly assigned businesses
  if (role === "support_agent") {
    const user = await User.findById(userId)
      .select("businesses role")
      .lean();

    if (!user) {
      throw createServiceError("User not found", 404);
    }

    if (user.role !== "support_agent") {
      throw createServiceError(
        "Invalid support agent account",
        403
      );
    }

    return Array.isArray(user.businesses)
      ? user.businesses
      : [];
  }

  throw createServiceError(
    "You do not have permission to access businesses",
    403
  );
};

// ======================================================
// Check if user can access a specific business
// ======================================================
const hasBusinessAccess = async ({
  userId,
  role,
  businessId,
}) => {
  if (!businessId) {
    return false;
  }

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return false;
  }

  // Admin -> allowed
  if (role === "admin") {
    const business = await Business.findOne({
      _id: businessId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    return !!business;
  }

  // Business owner -> own business only
  if (role === "business_owner") {
    const business = await Business.findOne({
      _id: businessId,
      owner: userId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    return !!business;
  }

  // Support agent -> assigned business only
  if (role === "support_agent") {
    const user = await User.findById(userId)
      .select("businesses role")
      .lean();

    if (!user || user.role !== "support_agent") {
      return false;
    }

    return (
      Array.isArray(user.businesses) &&
      user.businesses.some(
        (id) => id.toString() === businessId.toString()
      )
    );
  }

  return false;
};

// ======================================================
// Check business access and throw if denied
// ======================================================
const requireBusinessAccess = async ({
  userId,
  role,
  businessId,
}) => {
  const allowed = await hasBusinessAccess({
    userId,
    role,
    businessId,
  });

  if (!allowed) {
    throw createServiceError(
      "Business not found or access denied",
      403
    );
  }

  return true;
};

// ======================================================
// Check whether an assignee belongs to a business
// ======================================================
const validateAssigneeForBusiness = async ({
  assignedTo,
  businessId,
}) => {
  if (!assignedTo) {
    throw createServiceError(
      "Assigned user ID is required",
      400
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(assignedTo)
  ) {
    throw createServiceError(
      "Invalid assigned user ID",
      400
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(businessId)
  ) {
    throw createServiceError(
      "Invalid business ID",
      400
    );
  }

  const user = await User.findById(assignedTo)
    .select("_id name email role businesses")
    .lean();

  if (!user) {
    throw createServiceError(
      "Assigned user not found",
      404
    );
  }

  // Support agent must be assigned to this business
  if (user.role === "support_agent") {
    const assigned = Array.isArray(user.businesses)
      && user.businesses.some(
        (id) =>
          id.toString() === businessId.toString()
      );

    if (!assigned) {
      throw createServiceError(
        "Support agent is not assigned to this business",
        403
      );
    }

    return user;
  }

  // Business owner must own this business
  if (user.role === "business_owner") {
    const business = await Business.findOne({
      _id: businessId,
      owner: user._id,
    })
      .select("_id")
      .lean();

    if (!business) {
      throw createServiceError(
        "User does not belong to this business",
        403
      );
    }

    return user;
  }

  // Admin can be assigned
  if (user.role === "admin") {
    return user;
  }

  throw createServiceError(
    "Invalid assignee role",
    400
  );
};

module.exports = {
  getUserBusinessIds,
  hasBusinessAccess,
  requireBusinessAccess,
  validateAssigneeForBusiness,
};