process.env.JWT_SECRET = "test-jwt-secret";

jest.mock("../src/service/aiService", () => ({
  generateAIReply: jest.fn(),
}));

jest.mock("../src/service/embeddingService", () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock("../src/service/vectorSearchService", () => ({
  searchKnowledge: jest.fn(),
}));

jest.mock("../src/service/ragService", () => ({
  retrieveRelevantKnowledge: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findById: jest.fn(() => ({
    select: jest.fn(() => ({
      lean: jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        role: "business_owner",
      }),
    })),
  })),
}));

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

const aiRoutes = require("../src/routes/aiRoutes");

const app = express();

app.use(express.json());

app.use("/api/ai", aiRoutes);

describe("AI API", () => {
  const authHeader = `Bearer ${jwt.sign(
    { id: "507f1f77bcf86cd799439011" },
    process.env.JWT_SECRET
  )}`;

  test("should reject request when message is missing", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", authHeader)
      .send({
        businessId:
          "6a96eced1f541b3f90e9f429",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(
      false
    );
  });

  test("should reject request when businessId is missing", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", authHeader)
      .send({
        message:
          "How long does delivery take?",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(
      false
    );
  });

  test("should reject empty JSON body", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", authHeader)
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(
      false
    );
  });
});
