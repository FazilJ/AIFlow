const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [
        2,
        "Name must be at least 2 characters",
      ],
      maxlength: [
        100,
        "Name cannot exceed 100 characters",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        6,
        "Password must be at least 6 characters",
      ],
    },

    role: {
      type: String,
      enum: [
        "admin",
        "business_owner",
        "support_agent",
      ],
      default: "business_owner",
      index: true,
    },

    businesses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate business IDs
userSchema.path("businesses").validate(function (businesses) {
  if (!businesses || businesses.length === 0) {
    return true;
  }

  const ids = businesses.map((id) =>
    id.toString()
  );

  return ids.length === new Set(ids).size;
}, "Duplicate business assignments are not allowed");

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);