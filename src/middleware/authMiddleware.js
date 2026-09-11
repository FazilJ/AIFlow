const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// PROTECT MIDDLEWARE
// ======================================================

const protect = async (req, res, next) => {
  try {
    // ==================================================
    // CHECK JWT SECRET
    // ==================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error",
      });
    }

    // ==================================================
    // GET AUTHORIZATION HEADER
    // ==================================================

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required. Please login.",
      });
    }

    // ==================================================
    // EXTRACT TOKEN
    // ==================================================

    const token =
      authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing.",
      });
    }

    // ==================================================
    // VERIFY TOKEN
    // ==================================================

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // ==================================================
    // VALIDATE USER ID
    // ==================================================

    const userId =
      decoded?.id ||
      decoded?._id ||
      decoded?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    // ==================================================
    // CHECK USER IN DATABASE
    // ==================================================

    const user =
      await User.findById(userId)
        .select("-password")
        .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account no longer exists.",
      });
    }

    // ==================================================
    // ATTACH USER TO REQUEST
    // ==================================================

    req.user = user;


    // Keep decoded token available when needed
    req.auth = decoded;

    next();
  } catch (error) {
    // ==================================================
    // JWT ERRORS
    // ==================================================

    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed.",
    });
  }
};

// ======================================================
// ROLE AUTHORIZATION
// ======================================================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource.",
      });
    }

    next();
  };  
};

module.exports = {
  protect,
  authorize,
};  