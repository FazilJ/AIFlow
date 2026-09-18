const { GoogleGenAI } = require("@google/genai");

let ai;

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return ai;
};

const EMBEDDING_MODEL = "gemini-embedding-001";

const generateEmbedding = async (text) => {
  try {
    if (!text || !text.trim()) {
      throw new Error("Text is required for embedding");
    }

    const response = await getAIClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.trim(),
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Embedding generation failed");
    }

    return embedding;
  } catch (error) {
    console.error(
      "Embedding Generation Error:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  generateEmbedding,
};
