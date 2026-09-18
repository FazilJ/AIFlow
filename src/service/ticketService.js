const Ticket = require("../models/Ticket");
const Customer = require("../models/Customer");
const Business = require("../models/Business");

const checkBusinessAccess = async (user, businessId) => {
  if (user.role === "admin") {
    return true;
  }

  const business = await Business.findById(businessId).lean();

  if (!business) {
    const error = new Error("Business not found");
    error.statusCode = 404;
    throw error;
  }

  // Business owner
  if (
    user.role === "business_owner" &&
    business.owner.toString() === user._id.toString()
  ) {
    return true;
  }

  // Support agent
  const assignedBusinesses = (user.businesses || []).map(
    (id) => id.toString()
  );

  if (assignedBusinesses.includes(businessId.toString())) {
    return true;
  }

  const error = new Error(
    "You do not have access to this business"
  );

  error.statusCode = 403;
  throw error;
};


const createTicket = async ({
  user,
  businessId,
  customerId,
  subject,
  description,
  priority,
}) => {
  if (
    !businessId ||
    !customerId ||
    !subject ||
    !description
  ) {
    const error = new Error(
      "Business ID, customer ID, subject and description are required"
    );

    error.statusCode = 400;
    throw error;
  }

  await checkBusinessAccess(user, businessId);

  const customer = await Customer.findOne({
    _id: customerId,
    business: businessId,
    isActive: true,
  }).lean();

  if (!customer) {
    const error = new Error(
      "Customer not found for this business"
    );

    error.statusCode = 404;
    throw error;
  }

  const ticket = await Ticket.create({
    business: businessId,
    customer: customerId,
    subject: subject.trim(),
    description: description.trim(),
    priority: priority || "medium",
    status: "open",
  });

  return Ticket.findById(ticket._id)
    .populate("customer", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("business", "name")
    .lean();
};


const getTickets = async ({ user, businessId }) => {
  const filter = {};

  if (user.role === "admin") {
    if (businessId) {
      filter.business = businessId;
    }
  } else {
    if (!businessId) {
      const error = new Error("Business ID is required");
      error.statusCode = 400;
      throw error;
    }

    await checkBusinessAccess(user, businessId);

    filter.business = businessId;
  }

  return Ticket.find(filter)
    .populate("customer", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("business", "name")
    .sort({ createdAt: -1 })
    .lean();
};


const getTicketById = async ({
  ticketId,
  user,
}) => {
  const ticket = await Ticket.findById(ticketId)
    .populate("customer", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("business", "name owner")
    .lean();

  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  await checkBusinessAccess(
    user,
    ticket.business._id
  );

  return ticket;
};


module.exports = {
  createTicket,
  getTickets,
  getTicketById,
};