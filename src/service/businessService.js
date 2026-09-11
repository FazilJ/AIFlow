const Business = require("../models/Business");

// ======================================================
// CREATE BUSINESS
// ======================================================

const createBusiness = async (
  businessData,
  userId
) => {
  const business = await Business.create({
    ...businessData,
    owner: userId,
  });

  return business;
};

// ======================================================
// GET BUSINESSES
// ======================================================

const getBusinesses = async (
  userId,
  role
) => {
  let businesses;

  if (role === "admin") {
    // Admin can see all businesses
    businesses = await Business.find()
      .sort({
        createdAt: -1,
      })
      .lean();
  } else {
    // Business owner can see only own businesses
    businesses = await Business.find({
      owner: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  return businesses;
};

// ======================================================
// GET SINGLE BUSINESS
// ======================================================

const getBusinessById = async (
  businessId,
  userId,
  role
) => {
  let business;

  if (role === "admin") {
    // Admin can access any business
    business =
      await Business.findById(
        businessId
      ).lean();
  } else {
    // Business owner can access only own business
    business =
      await Business.findOne({
        _id: businessId,
        owner: userId,
      }).lean();
  }

  return business;
};

module.exports = {
  createBusiness,
  getBusinesses,
  getBusinessById,
};