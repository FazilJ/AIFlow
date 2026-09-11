const Appointment = require("../models/Appointment");
const Customer = require("../models/Customer");
const Business = require("../models/Business");

const bookAppointment = async ({
  businessId,
  customerId,
  date,
  time,
  purpose,
}) => {
  try {
    // 1. Check required fields
    if (
      !businessId ||
      !customerId ||
      !date ||
      !time
    ) {
      return {
        success: false,
        message:
          "Business ID, customer ID, date and time are required",
      };
    }

    // 2. Check business
    const business = await Business.findById(
      businessId
    );

    if (!business) {
      return {
        success: false,
        message: "Business not found",
      };
    }

    // 3. Check customer
    const customer = await Customer.findOne({
      _id: customerId,
      business: businessId,
    });

    if (!customer) {
      return {
        success: false,
        message:
          "Customer not found for this business",
      };
    }

    // 4. Check if same time is already booked
    const existingAppointment =
      await Appointment.findOne({
        business: businessId,
        date: new Date(date),
        time,
        status: {
          $in: ["pending", "confirmed"],
        },
      });

    if (existingAppointment) {
      return {
        success: false,
        booked: false,
        message:
          "This appointment time is already booked",
      };
    }

    // 5. Create appointment
    const appointment =
      await Appointment.create({
        business: businessId,
        customer: customerId,
        date: new Date(date),
        time,
        purpose:
          purpose || "General appointment",
        status: "confirmed",
      });

    return {
      success: true,
      booked: true,
      appointment: {
        id: appointment._id,
        customer: customer.name,
        business: business.name,
        date: appointment.date,
        time: appointment.time,
        purpose: appointment.purpose,
        status: appointment.status,
      },
    };
  } catch (error) {
    console.error(
      "Appointment Tool Error:",
      error
    );

    throw new Error(
      "Failed to book appointment"
    );
  }
};

module.exports = {
  bookAppointment,
};