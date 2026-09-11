const customerService = require("../service/customerService");

// ======================================================
// CREATE CUSTOMER
// ======================================================

const createCustomer = async (req, res, next) => {
  try {
    const customer =
      await customerService.createCustomer(
        req.body,
        req.user._id,
        req.user.role
      );

    res.status(201).json({
      success: true,
      message:
        "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET CUSTOMERS
// ======================================================

const getCustomers = async (
  req,
  res,
  next
) => {
  try {
    const customers =
      await customerService.getCustomers(
        req.user._id,
        req.user.role
      );

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PUBLIC WIDGET CUSTOMER IDENTIFICATION
// ======================================================

const identifyCustomer = async (
  req,
  res,
  next
) => {
  try {
    const {
      businessId,
      name,
      email,
    } = req.body;

    if (
      !businessId ||
      !name ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Business ID, name and email are required",
      });
    }

    const customer =
      await customerService.identifyCustomer({
        businessId,
        name,
        email,
      });

    res.status(200).json({
      success: true,
      message:
        "Customer identified successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createCustomer,
  getCustomers,
  identifyCustomer,
};