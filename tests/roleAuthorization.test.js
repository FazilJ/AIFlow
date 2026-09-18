const request = require("supertest");
const app = require("../src/app");

describe("Role Authorization Tests", () => {
  test("Protected admin-only route should reject unauthenticated request", async () => {
    const response = await request(app)
      .get("/api/integrations");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });
});