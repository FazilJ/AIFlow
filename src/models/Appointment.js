const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      required: [true, "Appointment date is required"],
    },

    time: {
      type: String,
      required: [true, "Appointment time is required"],
    },

    purpose: {
      type: String,
      trim: true,
      default: "General appointment",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ],
      default: "confirmed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({
  business: 1,
  date: 1,
  time: 1,
});

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);