const mongoose = require("mongoose");

const User = require("../models/User");
const Business = require("../models/Business");

// ======================================================
// Helper
// ======================================================
const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createServiceError(
      `Invalid ${fieldName}`,
      400
    );
  }
};

// ======================================================
// Get Support Agents
// ======================================================
const getSupportAgents = async (req, res, next) => {
  try {
    const supportAgents = await User.find({
      role: "support_agent",
    })
      .select("_id name email role businesses")
      .populate("businesses", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: supportAgents.length,
      data: supportAgents,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Get One Support Agent
// ======================================================
const getSupportAgentById = async (
  req,
  res,
  next
) => {
  try {
    const { userId } = req.params;

    validateObjectId(userId, "user ID");

    const user = await User.findOne({
      _id: userId,
      role: "support_agent",
    })
      .select("_id name email role businesses")
      .populate("businesses", "name email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Support agent not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Assign Business to Support Agent
// ======================================================
const assignBusinessToSupportAgent = async (
  req,
  res,
  next
) => {
  try {
    const { userId } = req.params;
    const { businessId } = req.body;

    // -----------------------------
    // Validate IDs
    // -----------------------------
    validateObjectId(userId, "user ID");
    validateObjectId(
      businessId,
      "business ID"
    );

    // -----------------------------
    // Find support agent
    // -----------------------------
    const supportAgent = await User.findOne({
      _id: userId,
      role: "support_agent",
    });

    if (!supportAgent) {
      return res.status(404).json({
        success: false,
        message: "Support agent not found",
      });
    }

    // -----------------------------
    // Find active business
    // -----------------------------
    const business = await Business.findOne({
      _id: businessId,
      isActive: { $ne: false },
    })
      .select("_id name email owner isActive")
      .lean();

    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business not found or inactive",
      });
    }

    // -----------------------------
    // Prevent duplicate assignment
    // -----------------------------
    const alreadyAssigned =
      Array.isArray(supportAgent.businesses) &&
      supportAgent.businesses.some(
        (id) =>
          id.toString() ===
          businessId.toString()
      );

    if (alreadyAssigned) {
      return res.status(200).json({
        success: true,
        message:
          "Support agent is already assigned to this business",
        data: {
          userId: supportAgent._id,
          businessId: business._id,
        },
      });
    }

    // -----------------------------
    // Assign business
    // -----------------------------
    supportAgent.businesses.push(
      business._id
    );

    await supportAgent.save();

    const updatedAgent =
      await User.findById(
        supportAgent._id
      )
        .select(
          "_id name email role businesses"
        )
        .populate(
          "businesses",
          "name email"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Business assigned to support agent successfully",
      data: updatedAgent,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Remove Business from Support Agent
// ======================================================
const removeBusinessFromSupportAgent =
  async (req, res, next) => {
    try {
      const {
        userId,
        businessId,
      } = req.params;

      validateObjectId(userId, "user ID");
      validateObjectId(
        businessId,
        "business ID"
      );

      const supportAgent =
        await User.findOne({
          _id: userId,
          role: "support_agent",
        });

      if (!supportAgent) {
        return res.status(404).json({
          success: false,
          message:
            "Support agent not found",
        });
      }

      // -----------------------------
      // Check assignment
      // -----------------------------
      const isAssigned =
        Array.isArray(
          supportAgent.businesses
        ) &&
        supportAgent.businesses.some(
          (id) =>
            id.toString() ===
            businessId.toString()
        );

      if (!isAssigned) {
        return res.status(404).json({
          success: false,
          message:
            "Business is not assigned to this support agent",
        });
      }

      // -----------------------------
      // Remove assignment
      // -----------------------------
      supportAgent.businesses =
        supportAgent.businesses.filter(
          (id) =>
            id.toString() !==
            businessId.toString()
        );

      await supportAgent.save();

      const updatedAgent =
        await User.findById(
          supportAgent._id
        )
          .select(
            "_id name email role businesses"
          )
          .populate(
            "businesses",
            "name email"
          )
          .lean();

      return res.status(200).json({
        success: true,
        message:
          "Business removed from support agent successfully",
        data: updatedAgent,
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// Get Support Agent's Assigned Businesses
// ======================================================
const getAssignedBusinesses =
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      validateObjectId(userId, "user ID");

      const supportAgent =
        await User.findOne({
          _id: userId,
          role: "support_agent",
        })
          .select("_id name email role businesses")
          .populate(
            "businesses",
            "name email owner isActive"
          )
          .lean();

      if (!supportAgent) {
        return res.status(404).json({
          success: false,
          message:
            "Support agent not found",
        });
      }

      const activeBusinesses =
        (supportAgent.businesses || []).filter(
          (business) =>
            business &&
            business.isActive !== false
        );

      return res.status(200).json({
        success: true,
        count: activeBusinesses.length,
        data: activeBusinesses,
      });
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  getSupportAgents,
  getSupportAgentById,
  assignBusinessToSupportAgent,
  removeBusinessFromSupportAgent,
  getAssignedBusinesses,
};