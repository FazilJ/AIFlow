const {
  createTicket,
  getTickets,
  getTicketById,
} = require("../service/ticketService");


const createNewTicket = async (req, res, next) => {
  try {
    const {
      businessId,
      customerId,
      subject,
      description,
      priority,
    } = req.body;

    const ticket = await createTicket({
      user: req.user,
      businessId,
      customerId,
      subject,
      description,
      priority,
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};


const getAllTickets = async (req, res, next) => {
  try {
    const { businessId } = req.query;

    const tickets = await getTickets({
      user: req.user,
      businessId,
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};


const getSingleTicket = async (req, res, next) => {
  try {
    const ticket = await getTicketById({
      ticketId: req.params.id,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createNewTicket,
  getAllTickets,
  getSingleTicket,
};