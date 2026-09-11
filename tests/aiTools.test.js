process.env.GEMINI_API_KEY = "test-gemini-api-key";

jest.mock("../src/service/ragService", () => ({
  retrieveRelevantKnowledge: jest.fn().mockResolvedValue({
    query: "find Ravi",
    results: [],
    context: "",
  }),
}));

jest.mock("../src/service/aiLogService", () => ({
  saveAILog: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/queues/aiLogQueue", () => ({
  aiLogQueue: {
    add: jest.fn().mockResolvedValue(),
  },
}));

jest.mock("../src/service/redisService", () => ({
  redisClient: {
    isReady: false,
  },
}));

describe("AI Tool Integration", () => {
  test("AI service module should load successfully", () => {
    const aiService = require("../src/service/aiService");

    expect(aiService).toBeDefined();

    expect(
      typeof aiService.generateAIReply
    ).toBe("function");

    expect(
      typeof aiService.streamAIReply
    ).toBe("function");
  });

  test("AI service should expose generateAIReply", () => {
    const {
      generateAIReply,
    } = require("../src/service/aiService");

    expect(
      generateAIReply
    ).toBeDefined();
  });
});
