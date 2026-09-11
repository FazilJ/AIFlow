const handoffService = require("../service/handoffService");

// ======================================================
// Create Handoff
// ======================================================
const createHandoff = async (req, res, next) => {
  try {
    const {
      businessId,
      conversationId,
      reason,
      priority,
    } = req.body;

    if (!businessId || !conversationId || !reason) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID, conversation ID and reason are required",
      });
    }

    const handoff = await handoffService.createHandoff({
      conversationId,
      businessId,
      reason,
      priority,
      userId: req.user._id,
      role: req.user.role,
    });

    res.status(201).json({
      success: true,
      message: "Handoff created successfully",
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Get All Handoffs
// ======================================================
const getHandoffs = async (req, res, next) => {
  try {
    const {
      businessId,
      status,
    } = req.query;

    const handoffs = await handoffService.getHandoffs({
      userId: req.user._id,
      role: req.user.role,
      businessId,
    });

    // Optional status filtering
    let filteredHandoffs = handoffs;

    if (status) {
      filteredHandoffs = handoffs.filter(
        (handoff) => handoff.status === status
      );
    }

    res.status(200).json({
      success: true,
      count: filteredHandoffs.length,
      data: filteredHandoffs,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Get One Handoff
// ======================================================
const getHandoffById = async (req, res, next) => {
  try {
    const { handoffId } = req.params;

    const handoff =
      await handoffService.getHandoffById({
        handoffId,
        userId: req.user._id,
        role: req.user.role,
      });

    if (!handoff) {
      return res.status(404).json({
        success: false,
        message: "Handoff not found",
      });
    }

    res.status(200).json({
      success: true,
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Assign Handoff
// ======================================================
const assignHandoff = async (req, res, next) => {
  try {
    const { handoffId } = req.params;
    const { userId } = req.body;

    if (!handoffId || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Handoff ID and user ID are required",
      });
    }

    const handoff =
      await handoffService.assignHandoff({
        handoffId,
        assignedTo: userId,
        userId: req.user._id,
        role: req.user.role,
      });

    res.status(200).json({
      success: true,
      message: "Handoff assigned successfully",
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Resolve Handoff
// ======================================================
const resolveHandoff = async (req, res, next) => {
  try {
    const { handoffId } = req.params;
    const { notes } = req.body;

    if (!handoffId) {
      return res.status(400).json({
        success: false,
        message: "Handoff ID is required",
      });
    }

    const handoff =
      await handoffService.resolveHandoff({
        handoffId,
        userId: req.user._id,
        role: req.user.role,
        notes,
      });

    res.status(200).json({
      success: true,
      message: "Handoff resolved successfully",
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Cancel Handoff
// ======================================================
const cancelHandoff = async (req, res, next) => {
  try {
    const { handoffId } = req.params;
    const { notes } = req.body;

    if (!handoffId) {
      return res.status(400).json({
        success: false,
        message: "Handoff ID is required",
      });
    }

    const handoff =
      await handoffService.cancelHandoff({
        handoffId,
        userId: req.user._id,
        role: req.user.role,
        notes,
      });

    res.status(200).json({
      success: true,
      message: "Handoff cancelled successfully",
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Public Widget Handoff
// ======================================================
const createWidgetHandoff = async (
  req,
  res,
  next
) => {
  try {
    const {
      businessId,
      conversationId,
      customerId,
      reason,
      priority,
      notes,
    } = req.body;

    if (
      !businessId ||
      !conversationId ||
      !customerId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID, conversation ID and customer ID are required",
      });
    }

    const Handoff = require("../models/Handoff");
    const Conversation = require("../models/Conversation");
    const Business = require("../models/Business");

    // -----------------------------
    // Check business
    // -----------------------------
    const business = await Business.findOne({
      _id: businessId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found or inactive",
      });
    }

    // -----------------------------
    // Check conversation belongs
    // to business + customer
    // -----------------------------
    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        business: businessId,
        customer: customerId,
      })
        .select("_id business customer")
        .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // -----------------------------
    // Prevent duplicate active
    // handoff
    // -----------------------------
    const existingHandoff =
      await Handoff.findOne({
        conversation: conversationId,
        status: {
          $in: [
            "pending",
            "assigned",
            "in_progress",
          ],
        },
      });

    if (existingHandoff) {
      return res.status(200).json({
        success: true,
        message:
          "Human support has already been requested",
        data: existingHandoff,
      });
    }

    // -----------------------------
    // Create handoff
    // -----------------------------
    const handoff = await Handoff.create({
      business: businessId,
      conversation: conversationId,
      customer: customerId,
      reason:
        typeof reason === "string" &&
        reason.trim()
          ? reason.trim()
          : "Customer requested human support",
      priority:
        priority || "medium",
      notes:
        typeof notes === "string"
          ? notes.trim()
          : "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Human support requested successfully",
      data: handoff,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHandoff,
  createWidgetHandoff,
  getHandoffs,
  getHandoffById,
  assignHandoff,
  resolveHandoff,
  cancelHandoff,
};