const request = require("supertest");
const app = require("../src/app");

describe("API Integration Tests", () => {
  test("Protected Customers API should reject request without authentication", async () => {
    const response = await request(app)
      .get("/api/customers");

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });

  test("Protected AI API should reject request without authentication", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .send({
        message: "Hello",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });
});