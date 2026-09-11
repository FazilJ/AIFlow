const mongoose = require("mongoose");

// ======================================================
// VALIDATION HELPERS
// ======================================================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const isNonEmptyString = (value) => {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
};

// ======================================================
// CUSTOMER LOOKUP VALIDATION
// ======================================================

const validateCustomerLookupArgs = (args = {}) => {
  const {
    email,
    phone,
    whatsappNumber,
  } = args;

  const hasIdentifier =
    isNonEmptyString(email) ||
    isNonEmptyString(phone) ||
    isNonEmptyString(whatsappNumber);

  if (!hasIdentifier) {
    return {
      valid: false,
      message:
        "Customer lookup requires email, phone, or WhatsApp number.",
    };
  }

  return {
    valid: true,
  };
};

// ======================================================
// BUSINESS INFO VALIDATION
// ======================================================

const validateBusinessInfoArgs = (args = {}) => {
  if (!isNonEmptyString(args.businessId)) {
    return {
      valid: false,
      message: "Business ID is required.",
    };
  }

  if (!isValidObjectId(args.businessId)) {
    return {
      valid: false,
      message: "Invalid Business ID.",
    };
  }

  return {
    valid: true,
  };
};

// ======================================================
// APPOINTMENT VALIDATION
// ======================================================

const validateAppointmentArgs = (args = {}) => {
  const {
    businessId,
    customerId,
    date,
    time,
  } = args;

  if (!isNonEmptyString(businessId)) {
    return {
      valid: false,
      message: "Business ID is required.",
    };
  }

  if (!isValidObjectId(businessId)) {
    return {
      valid: false,
      message: "Invalid Business ID.",
    };
  }

  if (!isNonEmptyString(customerId)) {
    return {
      valid: false,
      message: "Customer ID is required.",
    };
  }

  if (!isValidObjectId(customerId)) {
    return {
      valid: false,
      message: "Invalid Customer ID.",
    };
  }

  if (!isNonEmptyString(date)) {
    return {
      valid: false,
      message: "Appointment date is required.",
    };
  }

  if (!isNonEmptyString(time)) {
    return {
      valid: false,
      message: "Appointment time is required.",
    };
  }

  return {
    valid: true,
  };
};

// ======================================================
// TICKET VALIDATION
// ======================================================

const validateTicketArgs = (args = {}) => {
  const {
    businessId,
    customerId,
    subject,
    description,
    priority,
  } = args;

  if (!isNonEmptyString(businessId)) {
    return {
      valid: false,
      message: "Business ID is required.",
    };
  }

  if (!isValidObjectId(businessId)) {
    return {
      valid: false,
      message: "Invalid Business ID.",
    };
  }

  if (!isNonEmptyString(customerId)) {
    return {
      valid: false,
      message: "Customer ID is required.",
    };
  }

  if (!isValidObjectId(customerId)) {
    return {
      valid: false,
      message: "Invalid Customer ID.",
    };
  }

  if (!isNonEmptyString(subject)) {
    return {
      valid: false,
      message: "Ticket subject is required.",
    };
  }

  if (!isNonEmptyString(description)) {
    return {
      valid: false,
      message: "Ticket description is required.",
    };
  }

  if (
    priority &&
    !["low", "medium", "high", "urgent"].includes(
      priority
    )
  ) {
    return {
      valid: false,
      message: "Invalid ticket priority.",
    };
  }

  return {
    valid: true,
  };
};

// ======================================================
// TOOL ARGUMENT VALIDATOR
// ======================================================

const validateToolArguments = (
  toolName,
  args = {}
) => {
  switch (toolName) {
    case "customerLookup":
      return validateCustomerLookupArgs(args);

    case "getBusinessInfo":
      return validateBusinessInfoArgs(args);

    case "bookAppointment":
      return validateAppointmentArgs(args);

    case "createTicket":
      return validateTicketArgs(args);

    default:
      return {
        valid: false,
        message: `Unknown tool: ${toolName}`,
      };
  }
};

module.exports = {
  validateToolArguments,
};