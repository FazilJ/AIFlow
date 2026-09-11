const mongoose = require("mongoose");

const knowledgeChunkSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business is required"],
      index: true,
    },

    knowledgeBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeBase",
      required: [true, "Knowledge base is required"],
      index: true,
    },

    chunkIndex: {
      type: Number,
      required: [true, "Chunk index is required"],
    },

    content: {
      type: String,
      required: [true, "Chunk content is required"],
      trim: true,
    },

    // Vector representation of the chunk
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

knowledgeChunkSchema.index({
  business: 1,
  knowledgeBase: 1,
  chunkIndex: 1,
});

module.exports =
  mongoose.models.KnowledgeChunk ||
  mongoose.model(
    "KnowledgeChunk",
    knowledgeChunkSchema
  );