jest.mock("../src/service/embeddingService", () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock("../src/service/vectorSearchService", () => ({
  searchKnowledge: jest.fn(),
}));

const {
  retrieveRelevantKnowledge,
} = require("../src/service/ragService");

const {
  generateEmbedding,
} = require("../src/service/embeddingService");

const {
  searchKnowledge,
} = require("../src/service/vectorSearchService");

describe("RAG Service", () => {
  const businessId =
    "6a96eced1f541b3f90e9f429";

  beforeEach(() => {
    generateEmbedding.mockResolvedValue([
      0.1,
      0.2,
      0.3,
    ]);

    searchKnowledge.mockResolvedValue([
      {
        content:
          "Standard delivery takes 3 to 5 business days.",
        score: 0.95,
      },
    ]);
  });

  test("should retrieve relevant delivery knowledge", async () => {
    const result =
      await retrieveRelevantKnowledge(
        "How long does delivery take?",
        businessId,
        3
      );

    expect(result).toBeDefined();

    expect(result.query).toBe(
      "How long does delivery take?"
    );

    expect(
      Array.isArray(result.results)
    ).toBe(true);

    expect(
      result.results.length
    ).toBeGreaterThan(0);

    expect(
      result.context
    ).toContain(
      "Standard delivery takes 3 to 5 business days"
    );

    expect(generateEmbedding).toHaveBeenCalledWith(
      "How long does delivery take?"
    );

    expect(searchKnowledge).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3],
      businessId,
      3
    );
  });
});
