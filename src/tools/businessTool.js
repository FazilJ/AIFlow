const Business = require("../models/Business");

const getBusinessInfo = async ({
  businessId,
}) => {
  try {
    if (!businessId) {
      return {
        success: false,
        message: "Business ID is required",
      };
    }

    const business = await Business.findById(
      businessId
    ).select(
      "name email phone category description workingHours isActive"
    );

    if (!business) {
      return {
        success: false,
        found: false,
        message: "Business not found",
      };
    }

    return {
      success: true,
      found: true,
      business: {
        id: business._id,
        name: business.name,
        email: business.email,
        phone: business.phone,
        category: business.category,
        description: business.description,
        workingHours: business.workingHours,
        isActive: business.isActive,
      },
    };
  } catch (error) {
    console.error(
      "Business Information Tool Error:",
      error
    );

    throw new Error(
      "Failed to get business information"
    );
  }
};

module.exports = {
  getBusinessInfo,
};