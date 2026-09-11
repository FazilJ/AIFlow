const errorHandler = (err, req, res, next) => {
  // express.json() throws this when a client marks a plain-text body as JSON.
  // Return a useful client error instead of logging a full parser stack trace.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message:
        "Invalid JSON request body. Send an object such as {\"message\": \"How long does delivery take?\", \"businessId\": \"...\"}.",
    });
  }

  console.error(err);

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Duplicate MongoDB value
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // Unknown server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = errorHandler;
