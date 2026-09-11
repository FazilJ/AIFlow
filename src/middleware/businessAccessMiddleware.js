const mongoose = require("mongoose");

const {
  requireBusinessAccess,
} = require("../service/userAccessService");

// ======================================================
// Check Business Access
// ======================================================
const checkBusinessAccess = (
  businessIdSource = "body"
) => {
  return async (req, res, next) => {
    try {
      // -----------------------------
      // Authentication
      // -----------------------------
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // -----------------------------
      // Get business ID
      // -----------------------------
      let businessId;

      switch (businessIdSource) {
        case "body":
          businessId = req.body?.businessId;
          break;

        case "params":
          businessId = req.params?.businessId;
          break;

        case "query":
          businessId = req.query?.businessId;
          break;

        default:
          return res.status(500).json({
            success: false,
            message:
              "Invalid business ID source configured",
          });
      }

      // -----------------------------
      // Required
      // -----------------------------
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business ID is required",
        });
      }

      // -----------------------------
      // ObjectId validation
      // -----------------------------
      if (
        !mongoose.Types.ObjectId.isValid(
          businessId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Business ID",
        });
      }

      // -----------------------------
      // Actual tenant access check
      // -----------------------------
      await requireBusinessAccess({
        userId: req.user._id,
        role: req.user.role,
        businessId,
      });

      // -----------------------------
      // Store validated ID
      // -----------------------------
      req.requestedBusinessId =
        businessId.toString();

      next();
    } catch (error) {
      console.error(
        "Business access middleware error:",
        error.message
      );

      const statusCode =
        error.statusCode || 500;

      return res.status(statusCode).json({
        success: false,
        message:
          statusCode === 500
            ? "Business access validation failed"
            : error.message,
      });
    }
  };
};

module.exports = {
  checkBusinessAccess,
};