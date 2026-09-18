const {
  createAppointment,
  getAppointments,
  getAppointmentById,
} = require("../service/appointmentService");


// CREATE APPOINTMENT
const createNewAppointment = async (req, res, next) => {
  try {
    const {
      businessId,
      customerId,
      date,
      time,
      purpose,
      status,
    } = req.body;

    const appointment = await createAppointment({
      user: req.user,
      businessId,
      customerId,
      date,
      time,
      purpose,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};


// GET ALL APPOINTMENTS
const getAllAppointments = async (req, res, next) => {
  try {
    const { businessId } = req.query;

    const appointments = await getAppointments({
      user: req.user,
      businessId,
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};


// GET SINGLE APPOINTMENT
const getSingleAppointment = async (req, res, next) => {
  try {
    const appointment = await getAppointmentById({
      user: req.user,
      appointmentId: req.params.id,
    });

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createNewAppointment,
  getAllAppointments,
  getSingleAppointment,
};