const Ticket = require("../models/Ticket");
const Customer = require("../models/Customer");
const Business = require("../models/Business");

const createTicket = async ({
  businessId,
  customerId,
  subject,
  description,
  priority,
}) => {
  try {
    // Validate required fields
    if (
      !businessId ||
      !customerId ||
      !subject ||
      !description
    ) {
      return {
        success: false,
        created: false,
        message:
          "Business ID, customer ID, subject and description are required",
      };
    }

    // Check business
    const business = await Business.findById(businessId);

    if (!business) {
      return {
        success: false,
        created: false,
        message: "Business not found",
      };
    }

    // Check customer belongs to this business
    const customer = await Customer.findOne({
      _id: customerId,
      business: businessId,
    });

    if (!customer) {
      return {
        success: false,
        created: false,
        message: "Customer not found for this business",
      };
    }

    // Create ticket
    const ticket = await Ticket.create({
      business: businessId,
      customer: customerId,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || "medium",
      status: "open",
    });

    return {
      success: true,
      created: true,
      ticket: {
        id: ticket._id,
        business: business.name,
        customer: customer.name,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    };
  } catch (error) {
    console.error("Create Ticket Tool Error:", error);

    throw new Error("Failed to create support ticket");
  }
};

module.exports = {
  createTicket,
};