const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const Business = require("../models/Business");

// ======================================================
// Helper: Create service error
// ======================================================
const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const {
  getUserBusinessIds,
} = require("./userAccessService");

// ======================================================
// Helper: Validate ObjectId
// ======================================================
const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createServiceError(`Invalid ${fieldName}`, 400);
  }
};

// ======================================================
// Create Customer
// ======================================================
const createCustomer = async (customerData, userId, role) => {
  const {
    business,
    name,
    email,
    phone,
    whatsappNumber,
    source,
  } = customerData || {};

  // -----------------------------
  // Required fields
  // -----------------------------
  if (!business) {
    throw createServiceError("Business ID is required", 400);
  }

  if (!name || !name.trim()) {
    throw createServiceError("Customer name is required", 400);
  }

  validateObjectId(business, "business ID");

  // -----------------------------
  // Only admin / business owner
  // -----------------------------
  if (
    role !== "admin" &&
    role !== "business_owner"
  ) {
    throw createServiceError(
      "You do not have permission to create customers",
      403
    );
  }

  // -----------------------------
  // Check business access
  // -----------------------------
  let businessExists;

  if (role === "admin") {
    businessExists = await Business.findById(business)
      .select("_id name email owner isActive")
      .lean();
  } else {
    businessExists = await Business.findOne({
      _id: business,
      owner: userId,
    })
      .select("_id name email owner isActive")
      .lean();
  }

  if (!businessExists) {
    throw createServiceError(
      "Business not found or access denied",
      404
    );
  }

  // -----------------------------
  // Inactive business protection
  // -----------------------------
  if (businessExists.isActive === false) {
    throw createServiceError(
      "This business is inactive",
      403
    );
  }

  // -----------------------------
  // Normalize email
  // -----------------------------
  const normalizedEmail =
    typeof email === "string" && email.trim()
      ? email.trim().toLowerCase()
      : undefined;

  // -----------------------------
  // Normalize WhatsApp number
  // -----------------------------
  const normalizedWhatsAppNumber =
    typeof whatsappNumber === "string" &&
    whatsappNumber.trim()
      ? whatsappNumber.trim()
      : undefined;

  // -----------------------------
  // Create customer
  // -----------------------------
  const customer = await Customer.create({
    business,
    name: name.trim(),
    email: normalizedEmail,
    phone:
      typeof phone === "string"
        ? phone.trim()
        : phone,
    whatsappNumber: normalizedWhatsAppNumber,
    source:
      typeof source === "string" && source.trim()
        ? source.trim()
        : "manual",
  });

  return customer;
};

// ======================================================
// Identify / Create Customer from Public Widget
// ======================================================
const identifyCustomer = async ({
  businessId,
  name,
  email,
}) => {
  // -----------------------------
  // Validate inputs
  // -----------------------------
  if (!businessId) {
    throw createServiceError(
      "Business ID is required",
      400
    );
  }

  if (!name || !name.trim()) {
    throw createServiceError(
      "Customer name is required",
      400
    );
  }

  if (!email || !email.trim()) {
    throw createServiceError(
      "Customer email is required",
      400
    );
  }

  validateObjectId(businessId, "business ID");

  // -----------------------------
  // Check active business
  // -----------------------------
  const businessExists = await Business.findOne({
    _id: businessId,
    isActive: { $ne: false },
  })
    .select("_id name email")
    .lean();

  if (!businessExists) {
    throw createServiceError(
      "Business not found or inactive",
      404
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  // -----------------------------
  // Find existing customer
  // -----------------------------
  let customer = await Customer.findOne({
    business: businessId,
    email: normalizedEmail,
  });

  // -----------------------------
  // Create customer
  // -----------------------------
  if (!customer) {
    customer = await Customer.create({
      business: businessId,
      name: name.trim(),
      email: normalizedEmail,
      source: "website",
    });
  } else {
    // -----------------------------
    // Update customer name
    // -----------------------------
    if (name.trim() && customer.name !== name.trim()) {
      customer.name = name.trim();
      await customer.save();
    }
  }

  return customer;
};

// ======================================================
// Identify / Create Customer from WhatsApp
// ======================================================
const identifyWhatsAppCustomer = async ({
  businessId,
  name,
  whatsappNumber,
}) => {
  // -----------------------------
  // Validate inputs
  // -----------------------------
  if (!businessId) {
    throw createServiceError(
      "Business ID is required",
      400
    );
  }

  if (!whatsappNumber || !whatsappNumber.trim()) {
    throw createServiceError(
      "WhatsApp number is required",
      400
    );
  }

  validateObjectId(businessId, "business ID");

  // -----------------------------
  // Check active business
  // -----------------------------
  const businessExists = await Business.findOne({
    _id: businessId,
    isActive: { $ne: false },
  })
    .select("_id name email")
    .lean();

  if (!businessExists) {
    throw createServiceError(
      "Business not found or inactive",
      404
    );
  }

  const normalizedWhatsAppNumber =
    whatsappNumber.trim();

  // -----------------------------
  // Find existing customer
  // -----------------------------
  let customer = await Customer.findOne({
    business: businessId,
    whatsappNumber: normalizedWhatsAppNumber,
  });

  // -----------------------------
  // Create customer
  // -----------------------------
  if (!customer) {
    customer = await Customer.create({
      business: businessId,
      name:
        name && name.trim()
          ? name.trim()
          : "WhatsApp Customer",
      whatsappNumber: normalizedWhatsAppNumber,
      source: "whatsapp",
    });
  } else if (name && name.trim()) {
    // -----------------------------
    // Update customer name
    // -----------------------------
    const trimmedName = name.trim();

    if (customer.name !== trimmedName) {
      customer.name = trimmedName;
      await customer.save();
    }
  }

  return customer;
};

// ======================================================
// Get Customers
// ======================================================
const getCustomers = async (userId, role) => {
  let query = {};

  // Admin
  if (role === "admin") {
    query = {};
  }

  // Business Owner
  else if (role === "business_owner") {
    const businesses = await Business.find({
      owner: userId,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    const businessIds = businesses.map(
      (business) => business._id
    );

    if (businessIds.length === 0) {
      return [];
    }

    query = {
      business: {
        $in: businessIds,
      },
    };
  }

  // Support Agent
  else if (role === "support_agent") {
    const businessIds =
      await getUserBusinessIds(
        userId,
        role
      );

    if (businessIds.length === 0) {
      return [];
    }

    query.business = {
      $in: businessIds,
    };
  }

  // Unknown role
  else {
    throw createServiceError(
      "You do not have permission to view customers",
      403
    );
  }

  const customers = await Customer.find(query)
    .populate("business", "name email")
    .sort({ createdAt: -1 });

  return customers;
};

// ======================================================
// Exports
// ======================================================
module.exports = {
  createCustomer,
  getCustomers,
  identifyCustomer,
  identifyWhatsAppCustomer,
};