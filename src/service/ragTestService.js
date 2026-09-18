const mongoose = require("mongoose");
const Business = require("../models/Business");
const KnowledgeBase = require("../models/KnowledgeBase");
const { requireBusinessAccess } = require("./userAccessService");
const { retrieveRelevantKnowledge } = require("./ragService");

const testRag = async ({
  user,
  businessId,
  question,
  knowledgeBaseId,
  topK = 5,
}) => {
  if (!businessId) {
    const error = new Error("Business ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (!question || !question.trim()) {
    const error = new Error("Question is required");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid Business ID");
    error.statusCode = 400;
    throw error;
  }

  await requireBusinessAccess({
    userId: user._id,
    role: user.role,
    businessId,
  });

  const business = await Business.findById(businessId)
    .select("_id name")
    .lean();

  if (!business) {
    const error = new Error("Business not found");
    error.statusCode = 404;
    throw error;
  }

  if (knowledgeBaseId) {
    if (!mongoose.Types.ObjectId.isValid(knowledgeBaseId)) {
      const error = new Error("Invalid Knowledge Base ID");
      error.statusCode = 400;
      throw error;
    }

    const knowledgeBase = await KnowledgeBase.findOne({
      _id: knowledgeBaseId,
      business: businessId,
      isActive: true,
    })
      .select("_id title")
      .lean();

    if (!knowledgeBase) {
      const error = new Error(
        "Knowledge base document not found for this business"
      );
      error.statusCode = 404;
      throw error;
    }
  }

  const limit = Math.min(
    Math.max(Number(topK) || 5, 1),
    10
  );

  const { results: retrievedChunks } =
    await retrieveRelevantKnowledge(
      question.trim(),
      businessId,
      limit
    );

  const sources = await Promise.all(
    (retrievedChunks || []).map(async (chunk, index) => {
      let title = "Knowledge Source";

      /*
       * Try title directly from retrieved chunk
       */
      if (
        chunk.title &&
        chunk.title !== "Knowledge Source"
      ) {
        title = chunk.title;
      }

      /*
       * Try populated knowledgeBase
       */
      else if (chunk.knowledgeBase?.title) {
        title = chunk.knowledgeBase.title;
      }

      /*
       * If only knowledgeBase ID is available,
       * fetch the real document title.
       */
      else {
        const kbId =
          chunk.knowledgeBase?._id ||
          chunk.knowledgeBase;

        if (
          kbId &&
          mongoose.Types.ObjectId.isValid(kbId)
        ) {
          const knowledgeBase = await KnowledgeBase.findOne({
            _id: kbId,
            business: businessId,
            isActive: true,
          })
            .select("_id title")
            .lean();

          if (knowledgeBase?.title) {
            title = knowledgeBase.title;
          }
        }
      }

      return {
        rank: index + 1,

        chunkId: chunk._id,

        knowledgeBaseId:
          chunk.knowledgeBase?._id ||
          chunk.knowledgeBase ||
          null,

        title,

        content:
          chunk.content ||
          chunk.text ||
          "",

        score:
          typeof chunk.score === "number"
            ? chunk.score
            : typeof chunk.similarity === "number"
            ? chunk.similarity
            : null,
      };
    })
  );

  return {
    success: true,

    business: {
      id: business._id,
      name: business.name,
    },

    question: question.trim(),

    count: sources.length,

    sources,
  };
};

module.exports = {
  testRag,
};