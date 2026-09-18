const mongoose = require("mongoose");

const KnowledgeBase = require("../models/KnowledgeBase");
const KnowledgeChunk = require("../models/KnowledgeChunk");

const {
  createKnowledgeChunks,
} = require("../service/knowledgeBaseService");

const {
  requireBusinessAccess,
  hasBusinessAccess,
} = require("../service/userAccessService");


// ======================================================
// CREATE KNOWLEDGE BASE
// ======================================================
const createKnowledgeBase = async (req, res, next) => {
  try {
    const {
      businessId,
      title,
      content,
      source,
    } = req.body;

    if (!businessId || !title || !content) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID, title and content are required",
      });
    }

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

    await requireBusinessAccess({
      userId: req.user._id,
      role: req.user.role,
      businessId,
    });

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


// ======================================================
// GET KNOWLEDGE BASE DOCUMENTS
// ======================================================
const getKnowledgeBases = async (req, res, next) => {
  try {
    const { businessId } = req.query;

    // Admin can optionally filter by business
    if (req.user.role === "admin") {
      const filter = {};

      if (businessId) {
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

        filter.business = businessId;
      }

      const knowledgeBases =
        await KnowledgeBase.find(filter)
          .populate("business", "name")
          .sort({ createdAt: -1 })
          .lean();

      const data =
        await Promise.all(
          knowledgeBases.map(async (item) => {
            const chunksCount =
              await KnowledgeChunk.countDocuments({
                knowledgeBase: item._id,
              });

            return {
              ...item,
              chunksCount,
            };
          })
        );

      return res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    }

    // Non-admin users need business ID
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

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

    // Tenant access check
    const hasAccess =
      await hasBusinessAccess({
        userId: req.user._id,
        role: req.user.role,
        businessId,
      });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this business",
      });
    }

    const knowledgeBases =
      await KnowledgeBase.find({
        business: businessId,
      })
        .populate("business", "name")
        .sort({ createdAt: -1 })
        .lean();

    const data =
      await Promise.all(
        knowledgeBases.map(async (item) => {
          const chunksCount =
            await KnowledgeChunk.countDocuments({
              knowledgeBase: item._id,
            });

          return {
            ...item,
            chunksCount,
          };
        })
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createKnowledgeBase,
  getKnowledgeBases,
};