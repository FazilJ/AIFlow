const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Ticket = require("../models/Ticket");
const Appointment = require("../models/Appointment");
const Handoff = require("../models/Handoff");
const { pool } = require("../config/postgres");

// ==========================================
// DATE RANGE
// ==========================================
const getDateRange = (range = "7d") => {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case "24h":
      start.setHours(start.getHours() - 24);
      break;

    case "30d":
      start.setDate(start.getDate() - 30);
      break;

    case "90d":
      start.setDate(start.getDate() - 90);
      break;

    case "7d":
    default:
      start.setDate(start.getDate() - 7);
      break;
  }

  return {
    start,
    end: now,
  };
};

// ==========================================
// GET ANALYTICS
// ==========================================
const getAnalytics = async (businessId, range = "7d") => {
  // ==========================================
  // VALIDATE BUSINESS ID
  // ==========================================
  if (
    !businessId ||
    !mongoose.Types.ObjectId.isValid(businessId)
  ) {
    const error = new Error("Valid businessId is required");
    error.statusCode = 400;
    throw error;
  }

  // ==========================================
  // DATE RANGE
  // ==========================================
  const { start, end } = getDateRange(range);

  const businessObjectId =
    new mongoose.Types.ObjectId(businessId);

  const dateFilter = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };

  // ==========================================
  // MONGODB ANALYTICS
  // ==========================================
  const [
    totalCustomers,
    totalConversations,
    totalTickets,
    totalAppointments,
    totalHandoffs,
    conversationStatus,
    ticketStatus,
    channelBreakdown,
    dailyConversations,
    appointmentStatus,
    handoffStatus,
    recentConversations,
    recentTickets,
  ] = await Promise.all([
    // ==========================================
    // TOTAL CUSTOMERS
    // ==========================================
    Customer.countDocuments({
      business: businessObjectId,
      ...dateFilter,
    }),

    // ==========================================
    // TOTAL CONVERSATIONS
    // ==========================================
    Conversation.countDocuments({
      business: businessObjectId,
      ...dateFilter,
    }),

    // ==========================================
    // TOTAL TICKETS
    // ==========================================
    Ticket.countDocuments({
      business: businessObjectId,
      ...dateFilter,
    }),

    // ==========================================
    // TOTAL APPOINTMENTS
    // ==========================================
    Appointment.countDocuments({
      business: businessObjectId,
      ...dateFilter,
    }),

    // ==========================================
    // TOTAL HANDOFFS
    // ==========================================
    Handoff.countDocuments({
      business: businessObjectId,
      ...dateFilter,
    }),

    // ==========================================
    // CONVERSATION STATUS
    // ==========================================
    Conversation.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),

    // ==========================================
    // TICKET STATUS
    // ==========================================
    Ticket.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),

    // ==========================================
    // CONVERSATION CHANNELS
    // ==========================================
    Conversation.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$channel",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),

    // ==========================================
    // DAILY CONVERSATIONS
    // ==========================================
    Conversation.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),

    // ==========================================
    // APPOINTMENT STATUS
    // ==========================================
    Appointment.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),

    // ==========================================
    // HANDOFF STATUS
    // ==========================================
    Handoff.aggregate([
      {
        $match: {
          business: businessObjectId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),

    // ==========================================
    // RECENT CONVERSATIONS
    // ==========================================
    Conversation.find({
      business: businessObjectId,
      ...dateFilter,
    })
      .populate("customer", "name email")
      .sort({
        lastMessageAt: -1,
        createdAt: -1,
      })
      .limit(5)
      .lean(),

    // ==========================================
    // RECENT TICKETS
    // ==========================================
    Ticket.find({
      business: businessObjectId,
      ...dateFilter,
    })
      .populate("customer", "name email")
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean(),
  ]);

  // ==========================================
  // GET LATEST MESSAGE FOR RECENT CONVERSATIONS
  // ==========================================
  const conversationIds = recentConversations.map(
    (conversation) => conversation._id
  );

  let latestMessages = [];

  if (conversationIds.length > 0) {
    latestMessages = await Message.aggregate([
      {
        $match: {
          conversation: {
            $in: conversationIds,
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$conversation",

          content: {
            $first: "$content",
          },

          senderType: {
            $first: "$senderType",
          },

          messageType: {
            $first: "$messageType",
          },

          createdAt: {
            $first: "$createdAt",
          },
        },
      },
    ]);
  }

  // ==========================================
  // CREATE LATEST MESSAGE MAP
  // ==========================================
  const latestMessageMap = new Map(
    latestMessages.map((message) => [
      String(message._id),
      message,
    ])
  );

  // ==========================================
  // POSTGRESQL AI LOGS
  // ==========================================
  const aiLogsResult = await pool.query(
    `
      SELECT
        COUNT(*)::INTEGER AS total_requests,

        COUNT(*) FILTER (
          WHERE status = 'success'
        )::INTEGER AS successful_requests,

        COUNT(*) FILTER (
          WHERE status != 'success'
        )::INTEGER AS failed_requests,

        COALESCE(
          ROUND(AVG(latency_ms))::INTEGER,
          0
        ) AS average_latency_ms

      FROM ai_logs

      WHERE business_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `,
    [businessId, start, end]
  );

  // ==========================================
  // AI METRICS
  // ==========================================
  const aiMetrics = aiLogsResult.rows[0];

  const aiRequests = Number(
    aiMetrics?.total_requests || 0
  );

  const successfulAIRequests = Number(
    aiMetrics?.successful_requests || 0
  );

  const failedAIRequests = Number(
    aiMetrics?.failed_requests || 0
  );

  const successRate =
    aiRequests > 0
      ? Number(
          (
            (successfulAIRequests / aiRequests) *
            100
          ).toFixed(1)
        )
      : 0;

  // ==========================================
  // FINAL ANALYTICS RESPONSE
  // ==========================================
  return {
    range,

    // ==========================================
    // PERIOD
    // ==========================================
    period: {
      start,
      end,
    },

    // ==========================================
    // OVERVIEW
    // ==========================================
    overview: {
      customers: totalCustomers,
      conversations: totalConversations,
      tickets: totalTickets,
      appointments: totalAppointments,
      handoffs: totalHandoffs,
    },

    // ==========================================
    // AI
    // ==========================================
    ai: {
      requests: aiRequests,
      successfulRequests: successfulAIRequests,
      failedRequests: failedAIRequests,
      successRate,

      averageLatencyMs: Number(
        aiMetrics?.average_latency_ms || 0
      ),
    },

    // ==========================================
    // RECENT CONVERSATIONS
    // ==========================================
    recentConversations: recentConversations.map(
      (conversation) => {
        const latestMessage =
          latestMessageMap.get(
            String(conversation._id)
          );

        return {
          id: conversation._id,

          customer: conversation.customer
            ? {
                id: conversation.customer._id,
                name: conversation.customer.name,
                email: conversation.customer.email,
              }
            : null,

          channel: conversation.channel,

          status: conversation.status,

          latestMessage: latestMessage
            ? {
                content: latestMessage.content,

                senderType:
                  latestMessage.senderType,

                messageType:
                  latestMessage.messageType,

                createdAt:
                  latestMessage.createdAt,
              }
            : null,

          createdAt: conversation.createdAt,

          lastMessageAt:
            conversation.lastMessageAt,
        };
      }
    ),

    // ==========================================
    // RECENT TICKETS
    // ==========================================
    recentTickets: recentTickets.map(
      (ticket) => ({
        id: ticket._id,

        subject: ticket.subject,

        description: ticket.description,

        priority: ticket.priority,

        status: ticket.status,

        customer: ticket.customer
          ? {
              id: ticket.customer._id,
              name: ticket.customer.name,
              email: ticket.customer.email,
            }
          : null,

        createdAt: ticket.createdAt,
      })
    ),

    // ==========================================
    // CONVERSATIONS
    // ==========================================
    conversations: {
      status: conversationStatus.map(
        (item) => ({
          status: item._id,
          count: item.count,
        })
      ),

      channels: channelBreakdown.map(
        (item) => ({
          channel: item._id,
          count: item.count,
        })
      ),

      daily: dailyConversations.map(
        (item) => ({
          date: item._id,
          count: item.count,
        })
      ),
    },

    // ==========================================
    // TICKETS
    // ==========================================
    tickets: {
      status: ticketStatus.map(
        (item) => ({
          status: item._id,
          count: item.count,
        })
      ),
    },

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    appointments: {
      status: appointmentStatus.map(
        (item) => ({
          status: item._id,
          count: item.count,
        })
      ),
    },

    // ==========================================
    // HANDOFFS
    // ==========================================
    handoffs: {
      status: handoffStatus.map(
        (item) => ({
          status: item._id,
          count: item.count,
        })
      ),
    },
  };
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  getAnalytics,
};