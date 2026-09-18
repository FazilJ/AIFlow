const request = require("supertest");
const app = require("../src/app");

describe("AI API Tests", () => {
  test("AI chat should reject unauthenticated request", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .send({
        message: "Hello",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});