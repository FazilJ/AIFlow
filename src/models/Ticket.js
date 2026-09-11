const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

ticketSchema.index({
  business: 1,
  customer: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Ticket", ticketSchema);