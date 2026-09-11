const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [150, "Business name cannot exceed 150 characters"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    workingHours: {
      type: mongoose.Schema.Types.Mixed,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Business owner is required"],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ owner: 1, isActive: 1 });

module.exports =
  mongoose.models.Business ||
  mongoose.model("Business", businessSchema);
