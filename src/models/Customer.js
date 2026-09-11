const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    whatsappNumber: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      enum: ["website", "whatsapp", "instagram", "facebook", "manual"],
      default: "website",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ business: 1, email: 1 });

module.exports = mongoose.model("Customer", customerSchema);