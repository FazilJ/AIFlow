const businessService = require("../service/businessService");

// ======================================================
// CREATE BUSINESS
// ======================================================

const createBusiness = async (req, res, next) => {
  try {
    const business =
      await businessService.createBusiness(
        req.body,
        req.user._id
      );

    res.status(201).json({
      success: true,
      message:
        "Business created successfully",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET BUSINESSES
// ======================================================

const getBusinesses = async (
  req,
  res,
  next
) => {
  try {
    const businesses =
      await businessService.getBusinesses(
        req.user._id,
        req.user.role
      );

    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET SINGLE BUSINESS
// ======================================================

const getBusinessById = async (
  req,
  res,
  next
) => {
  try {
    const business =
      await businessService.getBusinessById(
        req.params.id,
        req.user._id,
        req.user.role
      );

    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createBusiness,
  getBusinesses,
  getBusinessById,
};