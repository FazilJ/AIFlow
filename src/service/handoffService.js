const mongoose = require("mongoose");

const Handoff = require("../models/Handoff");
const Conversation = require("../models/Conversation");
const Business = require("../models/Business");
const User = require("../models/User");

// ======================================================
// Helper
// ======================================================
const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const {
  getUserBusinessIds,
  requireBusinessAccess,
  validateAssigneeForBusiness,
} = require("./userAccessService");

const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createServiceError(`Invalid ${fieldName}`, 400);
  }
};

// ======================================================
// Check Business Access
// ======================================================
const checkBusinessAccess = async ({
  businessId,
  userId,
  role,
}) => {
  validateObjectId(businessId, "business ID");

  // Admin → all businesses
  if (role === "admin") {
    const business = await Business.findOne({
      _id: businessId,
    })
      .select("_id owner isActive")
      .lean();

    if (!business) {
      throw createServiceError("Business not found", 404);
    }

    if (business.isActive === false) {
      throw createServiceError(
        "This business is inactive",
        403
      );
    }

    return business;
  }

  // Business owner → own business only
  if (role === "business_owner") {
    const business = await Business.findOne({
      _id: businessId,
      owner: userId,
    })
      .select("_id owner isActive")
      .lean();

    if (!business) {
      throw createServiceError(
        "Business not found or access denied",
        404
      );
    }

    if (business.isActive === false) {
      throw createServiceError(
        "This business is inactive",
        403
      );
    }

    return business;
  }

  throw createServiceError(
    "You do not have permission to access this business",
    403
  );
};

// ======================================================
// Create Handoff
// ======================================================
const createHandoff = async ({
  conversationId,
  businessId,
  reason,
  priority = "medium",
  userId,
  role,
}) => {
  validateObjectId(
    conversationId,
    "conversation ID"
  );

  validateObjectId(businessId, "business ID");

  await checkBusinessAccess({
    businessId,
    userId,
    role,
  });

  // Check conversation belongs to business
  const conversation = await Conversation.findOne({
    _id: conversationId,
    business: businessId,
  });

  if (!conversation) {
    throw createServiceError(
      "Conversation not found or access denied",
      404
    );
  }

  if (!conversation.customer) {
    throw createServiceError(
      "Conversation customer is missing",
      400
    );
  }

  const handoff = await Handoff.create({
    conversation: conversationId,
    business: businessId,
    customer: conversation.customer,
    reason: reason?.trim() || "Customer requested human support",
    priority,
    status: "pending",
    requestedBy: userId,
  });

  return handoff;
};

// ======================================================
// Get Handoffs
// ======================================================

const getHandoffs = async ({
  userId,
  role,
  businessId,
}) => {
  let query = {};

  if (role === "admin") {
    if (businessId) {
      validateObjectId(
        businessId,
        "business ID"
      );

      query.business = businessId;
    }
  } else if (role === "business_owner") {
    if (businessId) {
      await checkBusinessAccess({
        businessId,
        userId,
        role,
      });

      query.business = businessId;
    } else {
      const businessIds =
        await getUserBusinessIds(
          userId,
          role
        );

      if (businessIds.length === 0) {
        return [];
      }

      query.business = {
        $in: businessIds,
      };
    }
  } else if (role === "support_agent") {
    const businessIds =
      await getUserBusinessIds(
        userId,
        role
      );

    if (businessIds.length === 0) {
      return [];
    }

    query.business = {
      $in: businessIds,
    };

    // Agent can see only handoffs assigned to them
    query.assignedTo = userId;
  } else {
    throw createServiceError(
      "You do not have permission to view handoffs",
      403
    );
  }

  return Handoff.find(query)
    .populate(
      "conversation",
      "customer channel status lastMessageAt"
    )
    .populate(
      "business",
      "name email"
    )
    .populate(
      "customer",
      "name email phone whatsappNumber"
    )
    .populate(
      "assignedTo",
      "name email role"
    )
    .sort({
      createdAt: -1,
    });
};

// ======================================================
// Get One Handoff
// ======================================================
const getHandoffById = async ({
  handoffId,
  userId,
  role,
}) => {
  validateObjectId(
    handoffId,
    "handoff ID"
  );

  const handoff = await Handoff.findById(
    handoffId
  )
    .populate(
      "conversation",
      "customer business channel status lastMessageAt"
    )
    .populate(
      "business",
      "name email owner"
    )
    .populate(
      "requestedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    );

  if (!handoff) {
    return null;
  }

  const businessId =
    handoff.business?._id ||
    handoff.business;

  // -----------------------------
  // Admin
  // -----------------------------
  if (role === "admin") {
    return handoff;
  }

  // -----------------------------
  // Business Owner
  // -----------------------------
  if (role === "business_owner") {
    const business = await Business.findOne({
      _id: businessId,
      owner: userId,
    })
      .select("_id")
      .lean();

    if (!business) {
      throw createServiceError(
        "Handoff not found or access denied",
        404
      );
    }

    return handoff;
  }

  // -----------------------------
  // Support Agent
  // -----------------------------
  if (role === "support_agent") {
    const assignedTo =
      handoff.assignedTo?._id ||
      handoff.assignedTo;

    if (
      !assignedTo ||
      assignedTo.toString() !==
        userId.toString()
    ) {
      throw createServiceError(
        "Handoff not found or access denied",
        404
      );
    }

    return handoff;
  }

  throw createServiceError(
    "You do not have permission to view this handoff",
    403
  );
};

// ======================================================
// Assign Handoff
// ======================================================
const assignHandoff = async ({
  handoffId,
  assignedTo,
  userId,
  role,
}) => {
  validateObjectId(
    handoffId,
    "handoff ID"
  );

  validateObjectId(
    assignedTo,
    "assigned user ID"
  );

  // Only admin / business owner
  // can assign
  if (
    role !== "admin" &&
    role !== "business_owner"
  ) {
    throw createServiceError(
      "You do not have permission to assign handoffs",
      403
    );
  }

  const handoff = await Handoff.findById(
    handoffId
  );

  if (!handoff) {
    throw createServiceError(
      "Handoff not found",
      404
    );
  }

  const businessId =
    handoff.business?.toString();

  if (!businessId) {
    throw createServiceError(
      "Handoff business is missing",
      400
    );
  }

  // Business access
  await checkBusinessAccess({
    businessId,
    userId,
    role,
  });

  // -----------------------------
  // Check assigned user
  // -----------------------------
  const assignee = await User.findById(
    assignedTo
  )
    .select("_id role")
    .lean();

  if (!assignee) {
    throw createServiceError(
      "Assigned user not found",
      404
    );
  }

  if (
    assignee.role !== "support_agent" &&
    assignee.role !== "business_owner" &&
    assignee.role !== "admin"
  ) {
    throw createServiceError(
      "Invalid assignee role",
      400
    );
  }

  // -----------------------------
  // Update handoff
  // -----------------------------
  handoff.assignedTo = assignee._id;

  handoff.status = "assigned";

  await handoff.save();

  // -----------------------------
  // Update conversation
  // -----------------------------
  await Conversation.findByIdAndUpdate(
    handoff.conversation,
    {
      assignedTo: assignee._id,
    }
  );

  return handoff;
};

// ======================================================
// Resolve Handoff
// ======================================================
const resolveHandoff = async ({
  handoffId,
  userId,
  role,
  resolution,
}) => {
  validateObjectId(
    handoffId,
    "handoff ID"
  );

  const handoff =
    await getHandoffById({
      handoffId,
      userId,
      role,
    });

  if (!handoff) {
    throw createServiceError(
      "Handoff not found",
      404
    );
  }

  if (
    handoff.status === "resolved" ||
    handoff.status === "cancelled"
  ) {
    throw createServiceError(
      `Handoff is already ${handoff.status}`,
      400
    );
  }

  handoff.status = "resolved";

  if (
    resolution &&
    typeof resolution === "string"
  ) {
    handoff.resolution =
      resolution.trim();
  }

  handoff.resolvedBy = userId;
  handoff.resolvedAt = new Date();

  await handoff.save();

  // Close conversation
  await Conversation.findByIdAndUpdate(
    handoff.conversation._id ||
      handoff.conversation,
    {
      status: "closed",
    }
  );

  return handoff;
};

// ======================================================
// Cancel Handoff
// ======================================================
const cancelHandoff = async ({
  handoffId,
  userId,
  role,
  reason,
}) => {
  validateObjectId(
    handoffId,
    "handoff ID"
  );

  // Only admin / business owner
  if (
    role !== "admin" &&
    role !== "business_owner"
  ) {
    throw createServiceError(
      "You do not have permission to cancel handoffs",
      403
    );
  }

  const handoff =
    await getHandoffById({
      handoffId,
      userId,
      role,
    });

  if (!handoff) {
    throw createServiceError(
      "Handoff not found",
      404
    );
  }

  if (
    handoff.status === "resolved" ||
    handoff.status === "cancelled"
  ) {
    throw createServiceError(
      `Handoff is already ${handoff.status}`,
      400
    );
  }

  handoff.status = "cancelled";

  if (
    reason &&
    typeof reason === "string"
  ) {
    handoff.resolution =
      reason.trim();
  }

  handoff.resolvedBy = userId;
  handoff.resolvedAt = new Date();

  await handoff.save();

  return handoff;
};

// ======================================================
// Exports
// ======================================================
module.exports = {
  createHandoff,
  getHandoffs,
  getHandoffById,
  assignHandoff,
  resolveHandoff,
  cancelHandoff,
};
