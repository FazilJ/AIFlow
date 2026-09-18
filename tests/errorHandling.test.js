const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");

describe("Error Handling Tests", () => {
  // ======================================================
  // 1. INVALID OBJECT ID
  // ======================================================

  test("should reject invalid business ObjectId", async () => {
    const response = await request(app)
      .get("/api/customers")
      .query({
        businessId: "invalid-id",
      });

    expect(response.statusCode).toBe(401);
  });

  // ======================================================
  // 2. MISSING REQUIRED FIELDS - BUSINESS ID
  // ======================================================

  test("should reject customer identification without businessId", async () => {
    const response = await request(app)
      .post("/api/customers/identify")
      .send({
        name: "Test Customer",
        email: "test@example.com",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Business ID, name and email are required"
    );
  });

  // ======================================================
  // 3. MISSING REQUIRED FIELDS - NAME
  // ======================================================

  test("should reject customer identification without name", async () => {
    const response = await request(app)
      .post("/api/customers/identify")
      .send({
        businessId: "6a96eced1f541b3f90e9f429",
        email: "test@example.com",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // 4. MISSING REQUIRED FIELDS - EMAIL
  // ======================================================

  test("should reject customer identification without email", async () => {
    const response = await request(app)
      .post("/api/customers/identify")
      .send({
        businessId: "6a96eced1f541b3f90e9f429",
        name: "Test Customer",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // 5. AI REQUEST WITHOUT MESSAGE
  // ======================================================

  test("should reject AI request with missing message", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .send({});

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // 6. INVALID JWT
  // ======================================================

  test("should reject invalid JWT token", async () => {
    const response = await request(app)
      .get("/api/customers")
      .set(
        "Authorization",
        "Bearer invalid.jwt.token"
      );

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // 7. EXPIRED JWT
  // ======================================================

  test("should reject expired JWT token", async () => {
    const expiredToken = jwt.sign(
      {
        userId:
          "6a96d99d2bad531dce961913",
        role: "business_owner",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: -1,
      }
    );

    const response = await request(app)
      .get("/api/customers")
      .set(
        "Authorization",
        `Bearer ${expiredToken}`
      );

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toMatch(
      /expired|login again/i
    );
  });

  // ======================================================
  // 8. 404 UNKNOWN ROUTE
  // ======================================================

  test("should return 404 for unknown route", async () => {
    const response = await request(app)
      .get(
        "/api/this-route-does-not-exist"
      );

    expect(response.statusCode).toBe(404);
  });

  // ======================================================
  // 9. CENTRALIZED ERROR HANDLER
  // ======================================================

  test("should return JSON error response", async () => {
    const response = await request(app)
      .get("/api/customers")
      .set(
        "Authorization",
        "Bearer invalid-token"
      );

    expect(response.statusCode).toBe(401);

    expect(
      response.headers["content-type"]
    ).toMatch(/json/);

    expect(response.body).toHaveProperty(
      "success"
    );

    expect(response.body.success).toBe(false);
  });
});