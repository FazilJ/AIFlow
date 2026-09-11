const mongoose = require("mongoose");

const Widget = require("../models/Widget");

const {
  requireBusinessAccess,
} = require("../service/userAccessService");

// ======================================================
// Create Widget
// ======================================================
const createWidget = async (req, res, next) => {
  try {
    const {
      businessId,
      name,
      welcomeMessage,
      primaryColor,
      position,
      allowedDomains,
    } = req.body;

    // -----------------------------
    // Required fields
    // -----------------------------
    if (!businessId || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID and widget name are required",
      });
    }

    // -----------------------------
    // Validate business ID
    // -----------------------------
    if (
      !mongoose.Types.ObjectId.isValid(
        businessId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Business ID",
      });
    }

    // -----------------------------
    // Validate widget name
    // -----------------------------
    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Widget name cannot be empty",
      });
    }

    // -----------------------------
    // Check business access
    // -----------------------------
    await requireBusinessAccess({
      userId: req.user._id,
      role: req.user.role,
      businessId,
    });

    // -----------------------------
    // Create widget
    // -----------------------------
    const widget = await Widget.create({
      business: businessId,
      name: name.trim(),

      welcomeMessage:
        typeof welcomeMessage === "string" &&
        welcomeMessage.trim()
          ? welcomeMessage.trim()
          : "Hi! How can I help you today?",

      primaryColor:
        typeof primaryColor === "string" &&
        primaryColor.trim()
          ? primaryColor.trim()
          : "#2563eb",

      position:
        typeof position === "string" &&
        position.trim()
          ? position.trim()
          : "bottom-right",

      allowedDomains:
        Array.isArray(allowedDomains)
          ? allowedDomains
          : [],
    });

    return res.status(201).json({
      success: true,
      message: "Widget created successfully",
      data: widget,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Get Public Widget
// ======================================================
const getPublicWidget = async (
  req,
  res,
  next
) => {
  try {
    const { widgetId } = req.params;

    // -----------------------------
    // Required
    // -----------------------------
    if (!widgetId) {
      return res.status(400).json({
        success: false,
        message: "Widget ID is required",
      });
    }

    // -----------------------------
    // Validate ObjectId
    // -----------------------------
    if (
      !mongoose.Types.ObjectId.isValid(
        widgetId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Widget ID",
      });
    }

    // -----------------------------
    // Find active widget
    // -----------------------------
    const widget = await Widget.findOne({
      _id: widgetId,
      isActive: true,
    }).select(
      "_id business name welcomeMessage primaryColor position isActive"
    );

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: widget,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWidget,
  getPublicWidget,
};