const request = require("supertest");
const app = require("../src/app");

describe("Customer API Tests", () => {
  test("GET /api/customers should reject unauthenticated request", async () => {
    const response = await request(app)
      .get("/api/customers");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});