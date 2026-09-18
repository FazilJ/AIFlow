const request = require("supertest");
const app = require("../src/app");

describe("Authentication Tests", () => {
  test("Protected route should reject request without JWT token", async () => {
    const response = await request(app)
      .get("/api/customers");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toMatch(
      /Authentication required|authentication token/i
    );
  });
});