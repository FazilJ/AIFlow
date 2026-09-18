const errorHandler = require("../src/middleware/errorHandler");

describe("Centralized Error Handler", () => {
  const createMockResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // errorHandler logs unknown/custom errors.
    // Keep Jest output clean.
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ======================================================
  // 1. INVALID JSON
  // ======================================================

  test("should return 400 for invalid JSON body", () => {
    const err = {
      type: "entity.parse.failed",
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(
          /Invalid JSON request body/i
        ),
      })
    );
  });

  // ======================================================
  // 2. CUSTOM APPLICATION ERROR
  // ======================================================

  test("should return custom statusCode and message", () => {
    const err = {
      statusCode: 403,
      message: "Business access denied",
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Business access denied",
    });
  });

  // ======================================================
  // 3. MONGOOSE VALIDATION ERROR
  // ======================================================

  test("should return 400 for Mongoose ValidationError", () => {
    const err = {
      name: "ValidationError",
      errors: {
        email: {
          message: "Email is required",
        },
        name: {
          message: "Name is required",
        },
      },
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      errors: [
        "Email is required",
        "Name is required",
      ],
    });
  });

  // ======================================================
  // 4. DUPLICATE MONGODB VALUE
  // ======================================================

  test("should return 409 for duplicate MongoDB value", () => {
    const err = {
      code: 11000,
      keyValue: {
        email: "test@example.com",
      },
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "email already exists",
    });
  });

  // ======================================================
  // 5. INVALID MONGODB OBJECT ID
  // ======================================================

  test("should return 400 for invalid MongoDB ObjectId", () => {
    const err = {
      name: "CastError",
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid ID format",
    });
  });

  // ======================================================
  // 6. UNKNOWN SERVER ERROR
  // ======================================================

  test("should return 500 for unknown server error", () => {
    const err = {
      name: "UnknownError",
      message: "Database connection failed",
    };

    const req = {};
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });
});