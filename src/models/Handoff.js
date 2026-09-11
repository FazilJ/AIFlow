const mongoose = require("mongoose");

const handoffSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    reason: {
      type: String,
      required: [true, "Handoff reason is required"],
      trim: true,
      maxlength: [2000, "Handoff reason cannot exceed 2000 characters"],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "resolved", "cancelled"],
      default: "pending",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

handoffSchema.index({ business: 1, status: 1, createdAt: -1 });
handoffSchema.index({ conversation: 1, status: 1 });

module.exports =
  mongoose.models.Handoff ||
  mongoose.model("Handoff", handoffSchema);
