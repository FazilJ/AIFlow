const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },

    source: {
      type: String,
      enum: ["manual", "file", "url", "faq",],
      default: "manual",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

knowledgeBaseSchema.index({
  business: 1,
  title: 1,
});

module.exports =
  mongoose.models.KnowledgeBase ||
  mongoose.model(
    "KnowledgeBase",
    knowledgeBaseSchema
  );
