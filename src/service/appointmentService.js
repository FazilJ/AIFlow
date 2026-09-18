const Appointment = require("../models/Appointment");
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

  // Support agent assigned to business
  const assignedBusinesses = (user.businesses || []).map((id) =>
    id.toString()
  );

  if (assignedBusinesses.includes(businessId.toString())) {
    return true;
  }

  const error = new Error("You do not have access to this business");
  error.statusCode = 403;
  throw error;
};


// CREATE APPOINTMENT
const createAppointment = async ({
  user,
  businessId,
  customerId,
  date,
  time,
  purpose,
  status,
}) => {
  if (!businessId || !customerId || !date || !time) {
    const error = new Error(
      "Business ID, customer ID, date and time are required"
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
    const error = new Error("Customer not found for this business");
    error.statusCode = 404;
    throw error;
  }

  const appointment = await Appointment.create({
    business: businessId,
    customer: customerId,
    date: new Date(date),
    time: time.trim(),
    purpose: purpose?.trim() || "General appointment",
    status: status || "confirmed",
  });

  return Appointment.findById(appointment._id)
    .populate("customer", "name email phone")
    .populate("business", "name")
    .lean();
};


// GET APPOINTMENTS
const getAppointments = async ({ user, businessId }) => {
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

  return Appointment.find(filter)
    .populate("customer", "name email phone")
    .populate("business", "name")
    .sort({ date: 1, time: 1 })
    .lean();
};


// GET SINGLE APPOINTMENT
const getAppointmentById = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("customer", "name email phone")
    .populate("business", "name owner")
    .lean();

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  await checkBusinessAccess(user, appointment.business._id);

  return appointment;
};


module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
};