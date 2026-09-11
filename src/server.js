require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const querystring = require("node:querystring");
const http = require("http");
const { WebSocketServer } = require("ws");

const connectDB = require("./config/db");

const businessRoutes = require("./routes/businessRoutes");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const knowledgeBaseRoutes = require("./routes/knowledgeBaseRoutes");
const handoffRoutes = require("./routes/handoffRoutes");
const widgetRoutes = require("./routes/widgetRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");

const { connectRedis } = require("./service/redisService");
const aiService = require("./service/aiService");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const userRoutes = require("./routes/userRoutes");


require("./queues/aiLogWorker");
require("./models/User");
require("./models/Business");

const app = express();

const mongoSanitizeOptions = {
  replaceWith: "_",
};

// Express 5 exposes req.query as a read-only getter. Sanitizing it in the
// package middleware causes an assignment error, so sanitize query data while
// it is parsed and mutate only the writable body and route params below.
app.set("query parser", (queryString) =>
  mongoSanitize.sanitize(
    querystring.parse(queryString),
    mongoSanitizeOptions
  )
);

const sanitizeRequest = (req, res, next) => {
  [req.body, req.params].forEach((value) => {
    if (value && typeof value === "object") {
      mongoSanitize.sanitize(
        value,
        mongoSanitizeOptions
      );
    }
  });

  next();
};

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: "/ws",
});

const {
  connectPostgres,
} = require("./config/postgres");



// ==========================================
// WEBSOCKET
// ==========================================

wss.on("connection", (ws) => {
  console.log("WebSocket client connected ✅");

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "AIFlow WebSocket connected",
    })
  );

  ws.on("message", async (data) => {
    try {
      const request = JSON.parse(
        data.toString()
      );

      console.log(
        "WebSocket message received:",
        request
      );

      const {
        type,
        message,
        businessId,
        conversationId,
      } = request;

      // ======================================
      // VALIDATE MESSAGE TYPE
      // ======================================

      if (type !== "ai_chat") {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Unsupported WebSocket message type",
          })
        );

        return;
      }

      // ======================================
      // VALIDATE MESSAGE
      // ======================================

      if (
        !message ||
        !message.trim()
      ) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Message is required",
          })
        );

        return;
      }

      // ======================================
      // VALIDATE BUSINESS
      // ======================================

      if (!businessId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Business ID is required",
          })
        );

        return;
      }

      console.log(
        "Starting AI stream..."
      );

      console.log(
        "Conversation ID:",
        conversationId || "None"
      );

      // ======================================
      // STREAM START
      // ======================================

      ws.send(
        JSON.stringify({
          type: "stream_start",
        })
      );

      // ======================================
      // AI STREAM
      // ======================================

      const reply =
        await aiService.streamAIReply(
          message.trim(),
          businessId,
          conversationId || null,
          (chunk) => {
            if (
              ws.readyState === ws.OPEN
            ) {
              ws.send(
                JSON.stringify({
                  type: "chunk",
                  content: chunk,
                })
              );
            }
          }
        );

      // ======================================
      // STREAM END
      // ======================================

      if (
        ws.readyState === ws.OPEN
      ) {
        ws.send(
          JSON.stringify({
            type: "stream_end",
            content: reply,
          })
        );
      }

      console.log(
        "AI stream completed ✅"
      );
    } catch (error) {
      console.error(
        "WebSocket AI Error:",
        error
      );

      if (
        ws.readyState === ws.OPEN
      ) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "AI service is temporarily unavailable",
          })
        );
      }
    }
  });

  // ==========================================
  // CONNECTION CLOSED
  // ==========================================

  ws.on("close", () => {
    console.log(
      "WebSocket client disconnected"
    );
  });

  // ==========================================
  // WEBSOCKET ERROR
  // ==========================================

  ws.on("error", (error) => {
    console.error(
      "WebSocket error:",
      error.message
    );
  });
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(cors());

app.use(
  express.json()
);

app.use(sanitizeRequest);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

app.use("/api", apiLimiter);

app.use(
  express.static(
    path.join(
      __dirname,
      "../public"
    )
  )
);

// ==========================================
// ROUTES
// ==========================================

app.use("/api/users", userRoutes);

app.use(
  "/api/whatsapp",
  whatsappRoutes
);

app.get("/", (req, res) => {
  res.send(
    "AIFlow API is running 🚀"
  );
});

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/businesses",
  businessRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/knowledge-base",
  knowledgeBaseRoutes
);

app.use(
  "/api/handoffs",
  handoffRoutes
);

app.use(
  "/api/widgets",
  widgetRoutes
);

// ==========================================
// CENTRAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// SERVER START
// ==========================================



const PORT =
  process.env.PORT || 5000;

  const startServer = async () => {
  try {
    await connectDB();

    await connectRedis();

    await connectPostgres();

    server.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );

      console.log(
        `WebSocket server running on ws://localhost:${PORT}/ws`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
