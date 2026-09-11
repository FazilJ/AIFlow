const KnowledgeBase = require("../models/KnowledgeBase");
const KnowledgeChunk = require("../models/KnowledgeChunk");
const { chunkText } = require("../utils/textChunker");

const {
  generateEmbedding,
} = require("./embeddingService");

const createKnowledgeChunks = async (knowledgeBaseId) => {
  try {
    const knowledgeBase =
      await KnowledgeBase.findById(knowledgeBaseId);

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    const chunks = chunkText(
      knowledgeBase.content,
      500,
      100
    );

    if (!chunks || chunks.length === 0) {
      throw new Error(
        "Knowledge base content cannot be empty"
      );
    }

    await KnowledgeChunk.deleteMany({
      knowledgeBase: knowledgeBase._id,
    });

    const chunkDocuments = [];

    for (let index = 0; index < chunks.length; index++) {
      const chunk = String(chunks[index]).trim();

      console.log(
        `Generating embedding for chunk ${index}...`
      );

      const embedding =
        await generateEmbedding(chunk);

      chunkDocuments.push({
        business: knowledgeBase.business,
        knowledgeBase: knowledgeBase._id,
        chunkIndex: index,
        content: chunk,
        embedding,
      });
    }

    console.log(
      `Creating ${chunkDocuments.length} knowledge chunks...`
    );

    const createdChunks =
      await KnowledgeChunk.insertMany(
        chunkDocuments
      );

    return createdChunks;
  } catch (error) {
    console.error(
      "Knowledge Chunk Creation Error:",
      error
    );

    throw error;
  }
};


// Generate embeddings for existing chunks
const generateEmbeddingsForExistingChunks =
  async () => {
    try {
      const chunks =
        await KnowledgeChunk.find({
          $or: [
            { embedding: { $exists: false } },
            { embedding: { $size: 0 } },
          ],
        });

      console.log(
        `Found ${chunks.length} chunks without embeddings`
      );

      for (const chunk of chunks) {
        console.log(
          `Generating embedding for chunk: ${chunk._id}`
        );

        const embedding =
          await generateEmbedding(
            chunk.content
          );

        chunk.embedding = embedding;

        await chunk.save();

        console.log(
          `Embedding saved for chunk: ${chunk._id}`
        );
      }

      return chunks.length;
    } catch (error) {
      console.error(
        "Existing Chunk Embedding Error:",
        error
      );

      throw error;
    }
  };


module.exports = {
  createKnowledgeChunks,
  generateEmbeddingsForExistingChunks,
};