const mongoose = require("mongoose");
const KnowledgeChunk = require("../models/KnowledgeChunk");

const cosineSimilarity = (left, right) => {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / Math.sqrt(
    leftMagnitude * rightMagnitude
  );
};

const searchWithFallback = async (
  queryEmbedding,
  businessObjectId,
  limit
) => {
  const chunks = await KnowledgeChunk.find({
    business: businessObjectId,
    embedding: {
      $exists: true,
      $ne: [],
    },
  })
    .select(
      "business knowledgeBase chunkIndex content embedding"
    )
    .lean();

  return chunks
    .filter(
      (chunk) =>
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length ===
          queryEmbedding.length
    )
    .map((chunk) => ({
      _id: chunk._id,
      business: chunk.business,
      knowledgeBase: chunk.knowledgeBase,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      score: cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      ),
    }))
    .sort(
      (first, second) =>
        second.score - first.score
    )
    .slice(0, limit);
};

const searchKnowledge = async (
  queryEmbedding,
  businessId,
  limit = 5
) => {
  if (
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length === 0
  ) {
    throw new Error(
      "Query embedding is required"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      businessId
    )
  ) {
    throw new Error(
      "Invalid Business ID"
    );
  }

  const businessObjectId =
    new mongoose.Types.ObjectId(
      businessId
    );

  const indexName =
    "knowledge_chunk_vector_index";

  try {
    console.log(
      "Trying Atlas Vector Search..."
    );

    const results =
      await KnowledgeChunk.aggregate([
        {
          $vectorSearch: {
            index: indexName,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: Math.max(
              limit * 20,
              100
            ),
            limit,
            filter: {
              business: businessObjectId,
            },
          },
        },
        {
          $project: {
            _id: 1,
            business: 1,
            knowledgeBase: 1,
            chunkIndex: 1,
            content: 1,
            score: {
              $meta:
                "vectorSearchScore",
            },
          },
        },
      ]);

    console.log(
      "Atlas Vector Search Results:",
      results.length
    );

    if (results.length > 0) {
      console.log(
        "Atlas Vector Search working ✅"
      );

      return results;
    }

    console.warn(
      "Atlas Vector Search returned no results. Using local fallback."
    );
  } catch (error) {
    console.warn(
      "Atlas Vector Search failed. Using local fallback:",
      error.message
    );
  }

  console.log(
    "Using local cosine similarity fallback..."
  );

  const fallbackResults =
    await searchWithFallback(
      queryEmbedding,
      businessObjectId,
      limit
    );

  console.log(
    "Local Fallback Results:",
    fallbackResults.length
  );

  return fallbackResults;
};

module.exports = {
  searchKnowledge,
};