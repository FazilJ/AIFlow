const express = require("express");
const mongoose = require("mongoose");

const {
  createKnowledgeBase,
} = require("../controllers/knowledgeBaseController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const KnowledgeBase = require("../models/KnowledgeBase");
const KnowledgeChunk = require("../models/KnowledgeChunk");

const {
  requireBusinessAccess,
  hasBusinessAccess,
} = require("../service/userAccessService");

const router = express.Router();

// ======================================================
// CREATE KNOWLEDGE BASE
// ======================================================
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "business_owner"
  ),
  createKnowledgeBase
);

// ======================================================
// GET KNOWLEDGE CHUNKS
// ======================================================
router.get(
  "/chunks/:knowledgeBaseId",
  protect,
  authorize(
    "admin",
    "business_owner",
    "support_agent"
  ),
  async (req, res, next) => {
    try {
      const {
        knowledgeBaseId,
      } = req.params;

      // -----------------------------
      // Validate ID
      // -----------------------------
      if (
        !mongoose.Types.ObjectId.isValid(
          knowledgeBaseId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Knowledge Base ID",
        });
      }

      // -----------------------------
      // Find Knowledge Base
      // -----------------------------
      const knowledgeBase =
        await KnowledgeBase.findById(
          knowledgeBaseId
        )
          .select(
            "_id business title isActive"
          )
          .lean();

      if (!knowledgeBase) {
        return res.status(404).json({
          success: false,
          message: "Knowledge base not found",
        });
      }

      // -----------------------------
      // Knowledge base inactive
      // -----------------------------
      if (
        knowledgeBase.isActive === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Knowledge base is inactive",
        });
      }

      // -----------------------------
      // Business access
      // -----------------------------
      const hasAccess =
        await hasBusinessAccess({
          userId: req.user._id,
          role: req.user.role,
          businessId:
            knowledgeBase.business,
        });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this knowledge base",
        });
      }

      // -----------------------------
      // Get chunks
      // -----------------------------
      const chunks =
        await KnowledgeChunk.find({
          knowledgeBase:
            knowledgeBaseId,
        })
          .sort({
            chunkIndex: 1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        count: chunks.length,
        data: chunks,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;