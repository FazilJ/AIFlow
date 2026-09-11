const {
  generateEmbedding,
} = require("./embeddingService");

const {
  searchKnowledge,
} = require("./vectorSearchService");

const retrieveRelevantKnowledge = async (
  query,
  businessId,
  limit = 3
) => {
  try {
    if (!query || !query.trim()) {
      throw new Error(
        "Query is required"
      );
    }

    if (!businessId) {
      throw new Error(
        "Business ID is required"
      );
    }

    // Step 1: Convert the user question into an embedding
    console.log(
      "Generating query embedding..."
    );

    const queryEmbedding =
      await generateEmbedding(
        query.trim()
      );

    // Step 2: Search the knowledge base
    console.log(
      "Searching relevant knowledge..."
    );

    const results =
      await searchKnowledge(
        queryEmbedding,
        businessId,
        limit
      );

    // Step 3: Prepare clean context
    const context = results
      .map((result, index) => {
        return `[Knowledge ${index + 1}]
${result.content}`;
      })
      .join("\n\n");

    return {
      query: query.trim(),
      results,
      context,
    };
  } catch (error) {
    console.error(
      "RAG Retrieval Error:",
      error
    );

    throw error;
  }
};

module.exports = {
  retrieveRelevantKnowledge,
};