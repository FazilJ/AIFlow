const mongoose = require("mongoose");

const KnowledgeBase = require("../models/KnowledgeBase");

const {
  createKnowledgeChunks,
} = require("../service/knowledgeBaseService");

const {
  requireBusinessAccess,
} = require("../service/userAccessService");

// ======================================================
// Create Knowledge Base
// ======================================================
const createKnowledgeBase = async (req, res, next) => {
  try {
    const {
      businessId,
      title,
      content,
      source,
    } = req.body;

    // -----------------------------
    // Required fields
    // -----------------------------
    if (!businessId || !title || !content) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID, title and content are required",
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
    // Validate title/content
    // -----------------------------
    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content cannot be empty",
      });
    }

    // -----------------------------
    // Tenant access check
    // -----------------------------
    await requireBusinessAccess({
      userId: req.user._id,
      role: req.user.role,
      businessId,
    });

    // -----------------------------
    // Create knowledge base
    // -----------------------------
    const knowledgeBase =
      await KnowledgeBase.create({
        business: businessId,
        title: title.trim(),
        content: content.trim(),
        source:
          typeof source === "string" &&
          source.trim()
            ? source.trim()
            : "manual",
      });

    // -----------------------------
    // Create chunks
    // -----------------------------
    const chunks =
      await createKnowledgeChunks(
        knowledgeBase._id
      );

    return res.status(201).json({
      success: true,
      message:
        "Knowledge base created successfully",
      data: {
        knowledgeBase,
        chunksCreated: chunks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKnowledgeBase,
};